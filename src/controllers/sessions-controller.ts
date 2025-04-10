import { Request, Response, NextFunction } from "express";
import { z } from "zod"
import { compare } from "bcrypt"
import { prisma } from "@/database/prisma"
import { AppError } from "@/utils/AppError";
import { sign } from "jsonwebtoken"
import { authConfig } from "@/config/auth"

class SessionsController {

  async create(request: Request, response: Response, _: NextFunction) {

    const bodySchema = z.object({
      email: z.string().email(),
      password: z.string()
    })

    const { email, password } = bodySchema.parse(request.body)

    const user = await prisma.user.findFirst({
      where: { email }
    })

    if (!user) { throw new AppError("Invalid user or password.")}

    const equal = await compare(password, user.password)
    
    if (!equal) throw new AppError("Invalid user or password.")

    const { secret, expiresIn } = authConfig.jwt

    const token = sign({ role: user.role ?? "member" }, secret, {
      subject: user.id,
      expiresIn
    })

    response.json({ token })

  }
}

const sessionsController = new SessionsController()

export { sessionsController }