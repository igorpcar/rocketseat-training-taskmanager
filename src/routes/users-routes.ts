import { usersController } from "@/controllers/users-controller";
import { checkAuthorization } from "@/middlewares/check-authorization";
import { ensureAuthenticated } from "@/middlewares/ensure-authenticated";
import { Roles } from "@prisma/client"
import { Router } from "express";

const usersRouter = Router()

usersRouter.use(ensureAuthenticated)
usersRouter.post("/", checkAuthorization([Roles.admin]), usersController.create)
// usersRouter.post("/", usersController.create)
usersRouter.get("/", checkAuthorization([Roles.admin]), usersController.index)
usersRouter.get("/:id/tasks", checkAuthorization([Roles.admin, Roles.member]), usersController.showTasks)
usersRouter.delete("/:id", checkAuthorization([Roles.admin, Roles.member]), usersController.delete)

export { usersRouter }