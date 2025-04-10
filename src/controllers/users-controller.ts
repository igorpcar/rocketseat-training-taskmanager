import { Request, Response, NextFunction } from "express";
import { AppError } from "@/utils/AppError";
import { prisma } from "@/database/prisma"
import z from "zod";
import { hash, compare } from "bcrypt"
import { Roles } from "@prisma/client";


class UsersController {
  async create(request: Request, response: Response, _: NextFunction) {

    const bodySchema = z.object({
      name: z.string(),
      email: z.string().email(),
      password: z.string(), // Colocar restrições
    })

    const { name, email, password } = bodySchema.parse(request.body)

    const userExists = await prisma.user.findFirst({
      where: { email }
    })

    if (userExists) {
      throw new AppError("User already exists.", 400)
    }

    const password_hashed = await hash(password, 8)

    const output = await prisma.user.create({
      data: { name, email, password: password_hashed}
    })

    const { password: p_, ...cleanUser  } = output

    response.status(201).json(cleanUser)
  }

  async index(request: Request, response: Response, _: NextFunction){

    const users = await prisma.user.findMany({
      include: {
        teams: {
          select: {
            team: {
              select: { id:true, name: true }
            }
          }
        }
      }
    })

    const usersWithoutPassword = users.reduce<any[]>( (accumulated, current) => {
      const { password, ...userWithoutPassword } = current
      const transform = {
        ...userWithoutPassword,
        teams: userWithoutPassword.teams.map( entry => entry.team )
      }
      accumulated.push(transform)
      return accumulated
    }, [])

    response.json(usersWithoutPassword)
  }

  async showTasks(request: Request, response: Response, _: NextFunction){

    const id = z.string().parse(request.params.id)

    if (!request.user || (request.user.role !== Roles.admin && id !== request.user.id )) {
      throw new AppError("Unauthorized", 401)
    }

    const userTasks = await prisma.user.findMany({
      select: {
        tasks: true
      },
      where: {
        id
      }
    })
    
    if(!userTasks[0]) { throw new AppError("User doest not exist. ")}

    response.json(userTasks[0].tasks)

  }

  async delete(request: Request, response: Response, _: NextFunction){

    const id = z.string().parse(request.params.id)

    const user = await prisma.user.findUnique({ where: { id } })

    if (!user) throw new AppError("User doest not exist")

    const teamAssignment = ( await prisma.teamMember.findMany({
      select: { id: true },
      where: { user_id: user.id }
    }) ).map(element => element.id)

    if (teamAssignment) {
      await prisma.teamMember.deleteMany({
        where: {
          id: {
            in: teamAssignment
          }
        }
      })
    }

    await prisma.user.delete({ where: { id }})

    response.json()

  }
}

const usersController = new UsersController()

export { usersController }