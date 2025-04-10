import { Request, Response, NextFunction } from "express";
import { z } from "zod"
import { Status, Priority, Roles } from "@prisma/client"
import { prisma } from "@/database/prisma";
import { AppError } from "@/utils/AppError";


class TasksController {
  async create(request: Request, response: Response, _: NextFunction) {
    
    const tasksSchema = z.object({
      title: z.string(),
      description: z.string(),
      status: z.enum([...(Object.values(Status) as [Status, ...Status[]])]),
      priority: z.enum([...(Object.values(Priority) as [Priority, ...Priority[]])]),
      user_id: z.string(),
      team_id: z.string()
    })

    const { title, description, status,priority, user_id, team_id } = tasksSchema.parse(request.body)

    const user = await prisma.user.findUnique({ where: { id: user_id }})
    if (!user) { throw new AppError("User doest not exist.")}

    const team = await prisma.team.findUnique({ where: { id: team_id }})
    if (!team) { throw new AppError("Team doest not exist.")}

    const taskCreated = await prisma.task.create({
      data: {
        title, description, status,priority, assigned_to: user_id, team_id
      }
    })

    response.status(201).json(taskCreated)

  }

  async index(request: Request, response: Response, _: NextFunction) {

    const tasks = await prisma.task.findMany()

    response.json(tasks)

  }

  async show(request: Request, response: Response, _: NextFunction) {

    const id = z.string().parse(request.params.id)

    const task = await prisma.task.findUnique({
      include: {
        taskHistory: true
      },
      where: { id }
    })

    if (!request.user) throw new AppError("Unauthorized.", 401)
    if (request.user.role !== Roles.admin && task?.assigned_to !== request.user.id) throw new AppError("Unauthorized.", 401)

    if (!task) throw new AppError("Task does not exist.")

    response.json(task)

  }
  
  async partialUpdate(request: Request, response: Response, _: NextFunction) {
    
    const bodySchema = z.object({
      status: z.enum([...(Object.values(Status) as [Status, ...Status[]])]).optional(),
      priority: z.enum([...(Object.values(Priority) as [Priority, ...Priority[]])]).optional(),
    })

    const id = z.string().parse(request.params.id)
    const { status, priority } = bodySchema.parse(request.body)

    if (!request.user) throw new AppError("Unauthorized.", 401)
    
    if (!status && !priority) { throw new AppError("Must inform status or priority.")}

    const task = await prisma.task.findUnique({
      where: { id }
    })

    if (!task) throw new AppError("Task does not exist")

      
    if (request.user.role !== Roles.admin && task.assigned_to !== request.user.id) {
      throw new AppError("Unauthorized", 401)
    }

    if (status && task.status !== status) {
      await prisma.taskHistory.create({
        data: {
          task_id: task.id,
          changed_by: request.user.id,
          old_status: task.status,
          new_status: status
        }
      })

    }


    await prisma.task.update({
      data: {
        ...(status && { status }),
        ...(priority && { priority }),
      },
      where: {
        id
      }
    })

    response.json()
  }

  async delete(request: Request, response: Response, _: NextFunction){

    const id = z.string().parse(request.params.id)

    const task = await prisma.task.findUnique({ where: { id } })

    if (!task) throw new AppError("Task doest not exist")

    await prisma.task.delete({ where: { id }})

    response.json()

  }
  
}

const tasksController = new TasksController()

export { tasksController }