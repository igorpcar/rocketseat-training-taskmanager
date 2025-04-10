import { AppError } from "@/utils/AppError";
import { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";



export function errorHandling(error: any, request: Request, response: Response, _: NextFunction){

  if (error instanceof AppError) {
    response.status(error.status).json({ message: error.message })
    return
  }

  if (error instanceof ZodError) {
    response.status(400).json({ message: error.flatten() })
    return
  }

  console.log(error)
  response.status(500).json({ message: error.message})
  
}