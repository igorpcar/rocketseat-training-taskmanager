import { teamsController } from "@/controllers/teams-controller"
import { checkAuthorization } from "@/middlewares/check-authorization"
import { ensureAuthenticated } from "@/middlewares/ensure-authenticated"
import { Roles } from "@prisma/client"
import { Router } from "express"

const teamsRouter = Router()

teamsRouter.use(ensureAuthenticated)
teamsRouter.post("/", checkAuthorization([Roles.admin]), teamsController.create)
teamsRouter.get("/", checkAuthorization([Roles.admin]), teamsController.index)
teamsRouter.post("/:id/member", checkAuthorization([Roles.admin]), teamsController.assignUser)
teamsRouter.delete("/:id", checkAuthorization([Roles.admin]), teamsController.delete)
teamsRouter.delete("/:id/member/:user_id", checkAuthorization([Roles.admin]), teamsController.removeMember)
teamsRouter.get("/:id/tasks", checkAuthorization([Roles.admin, Roles.member]), teamsController.showTasks)

export { teamsRouter }
