import { tasksController } from "@/controllers/tasks-controller"
import { checkAuthorization } from "@/middlewares/check-authorization"
import { ensureAuthenticated } from "@/middlewares/ensure-authenticated"
import { Roles } from "@/prisma/generated/client"
import { Router } from "express"

const tasksRouter = Router()

tasksRouter.use(ensureAuthenticated)
tasksRouter.post("/", checkAuthorization([Roles.admin]), tasksController.create)
tasksRouter.get("/", checkAuthorization([Roles.admin]), tasksController.index)
tasksRouter.get("/:id", checkAuthorization([Roles.admin, Roles.member]), tasksController.show)
tasksRouter.delete("/:id", checkAuthorization([Roles.admin, Roles.member]), tasksController.delete)
tasksRouter.patch("/:id", checkAuthorization([Roles.admin, Roles.member]), tasksController.partialUpdate)

export { tasksRouter }
