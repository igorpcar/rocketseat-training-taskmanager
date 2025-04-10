import { prisma } from "@/database/prisma"
import { AppError } from "@/utils/AppError";
import { Roles } from "@prisma/client";
import { Request, Response, NextFunction } from "express";
import z from "zod";

class TeamsController {
  async create(request: Request, response: Response, _: NextFunction) {
   
    const bodySchema = z.object({
      name: z.string(),
      description: z.string(),
    })

    const { name, description } = bodySchema.parse(request.body)

    const teamExists = await prisma.team.findFirst({
      where: {
        name: {
          equals: name,
          mode: 'insensitive'
        },
      },
    })

    if (teamExists) {
      throw new AppError("Team already exists")
    }

    const createdTeam = await prisma.team.create({
      data: {
        name,
        description
      }
    })

    response.status(201).json(createdTeam)

  }

  async assignUser(request: Request, response: Response, _: NextFunction) {

    const userId = z.string().parse(request.body.user_id) 
    const teamId = z.string().parse(request.params.id)

    const user = await prisma.user.findUnique({ where: { id: userId }})

    if (!user) {
      throw new AppError("User does not exist.")
    }

    const team = await prisma.team.findUnique({ where: { id: teamId }})

    if (!team) {
      throw new AppError("Team does not exist.")
    }

    const assignmentExists = await prisma.teamMember.findFirst({
      where: { team_id: teamId, user_id: userId }
    })

    if (assignmentExists) {
      throw new AppError("User already belongs to this team.")
    }

    await prisma.teamMember.create({
      data: {
        team_id: teamId, user_id: userId
      }
    })

    response.json()
  }

  async index(request: Request, response: Response, _: NextFunction){

    const teams = await prisma.team.findMany({
      include: {
        userMembers: {
          select: {
            user: { select: { id: true, name: true, email: true }},
          },
        },
      },
    })

    response.json(teams)

  }

  async showTasks(request: Request, response: Response, _: NextFunction){

    const id = z.string().parse(request.params.id)

    const user = request.user
    if (!user) throw new AppError("Unauthorized", 401)

    const userTeams = await prisma.teamMember.findMany({
      select: { team_id: true },
      where: {user_id: user.id}
    })

    const userTeamsList = userTeams.map(team => team.team_id)

    if (!userTeamsList.includes(id) && user.role !== Roles.admin) throw new AppError("Unauthorized", 401)

    const teamTasks = await prisma.team.findMany({
      select: {
        teamTask: true
      },
      where: {
        id
      }
    })
    
    if(!teamTasks[0]) { throw new AppError("Team doest not exist.")}

    response.json(teamTasks[0].teamTask)

  }

  async removeMember(request: Request, response: Response, _: NextFunction){

    const paramsSchema = z.object({
      id: z.string(),
      user_id: z.string()
    })

    const { id, user_id } = paramsSchema.parse(request.params)

    const team = await prisma.team.findUnique({ where: { id }})
    if (!team) { throw new AppError("Team does not exist.") }

    const member = await prisma.teamMember.findUnique({
      where: { user_id_team_id: {
          team_id: id,
          user_id
        }}})
    if (!member) { throw new AppError("User does not exist or is not assigned to this team.") }

    await prisma.teamMember.delete({ where: { id: member.id }})

    response.json()

  }

  async delete(request: Request, response: Response, _: NextFunction){
  
      const id = z.string().parse(request.params.id)
  
      const team = await prisma.team.findUnique({ where: { id } })

      if (!team) throw new AppError("Team doest not exist")

      const userAssignments = ( await prisma.teamMember.findMany({ 
        select: { id: true },
        where: { team_id: team.id } 
      }) ).map(element => element.id)
      
      if (userAssignments) {
        await prisma.teamMember.deleteMany({
          where: {
            id: { in: userAssignments}
          }
        })
      }
  
      await prisma.team.delete({ where: { id }})
  
      response.json()
  
    }
}

const teamsController = new TeamsController()

export { teamsController }