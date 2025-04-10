import { Request, Response, NextFunction } from "express"
import { z } from "zod"
import { sign, verify } from "jsonwebtoken"
import { AppError } from "@/utils/AppError"
import { prisma } from "@/database/prisma"
import { authConfig } from "@/config/auth"

interface JwtPayload {
  sub: string
  role: string
}

export async function ensureAuthenticated(request: Request, response: Response, next: NextFunction) {

  try {
    
    const auth = request.headers.authorization
    const token = auth?.split(" ")[1]
  
    if(!token) { throw new AppError("Missing authorization token.")}

    const { secret } = authConfig.jwt
  
    const { sub: userId, role } = verify(token, secret) as JwtPayload
  
    const user = await prisma.user.findFirst({
      where: { id: userId }
    })

    request.user = {
      id: userId as string,
      role 
    }

    next()

  } catch (error) {
    next(error)
  }
}