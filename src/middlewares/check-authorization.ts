import { AppError } from "@/utils/AppError";
import { Request, Response, NextFunction } from "express";


export function checkAuthorization(roles: string[]){

  return (request: Request, response: Response, next: NextFunction) => {

    if (!request.user) throw new AppError("Unauthorized", 401)

    if (!roles.includes(request.user.role)) throw new AppError("Unauthorized", 401)

      next()

  }

}