import { sessionsController } from "@/controllers/sessions-controller";
import { Router } from "express";

const sessionsRouter = Router()

sessionsRouter.post("/", sessionsController.create)

export { sessionsRouter }