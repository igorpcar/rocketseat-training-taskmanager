import { Router } from "express"
import { sessionsRouter } from "./sessions-routes"
import { usersRouter } from "./users-routes"
import { tasksRouter } from "./tasks-routes"
import { teamsRouter } from "./teams-routes"

const router = Router()

router.use("/sessions", sessionsRouter)
router.use("/users", usersRouter)
router.use("/teams", teamsRouter)
router.use("/tasks", tasksRouter)

export { router }