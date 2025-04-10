"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/app.ts
var app_exports = {};
__export(app_exports, {
  app: () => app
});
module.exports = __toCommonJS(app_exports);
var import_express6 = __toESM(require("express"));

// src/routes/index.ts
var import_express5 = require("express");

// src/controllers/sessions-controller.ts
var import_zod2 = require("zod");
var import_bcrypt = require("bcrypt");

// src/database/prisma.ts
var import_client = require("@prisma/client");
var prisma = new import_client.PrismaClient({});

// src/utils/AppError.ts
var AppError = class {
  message;
  status;
  constructor(message, status = 400) {
    this.message = message;
    this.status = status;
  }
};

// src/controllers/sessions-controller.ts
var import_jsonwebtoken = require("jsonwebtoken");

// src/env.ts
var import_zod = require("zod");
var envSchema = import_zod.z.object({
  DATABASE_URL: import_zod.z.string(),
  JWT_SECRET: import_zod.z.string(),
  PORT: import_zod.z.coerce.number().default(3333)
});
var env = envSchema.parse(process.env);

// src/config/auth.ts
var authConfig = {
  jwt: {
    secret: env.JWT_SECRET,
    expiresIn: "1d"
  }
};

// src/controllers/sessions-controller.ts
var SessionsController = class {
  async create(request, response, _) {
    const bodySchema = import_zod2.z.object({
      email: import_zod2.z.string().email(),
      password: import_zod2.z.string()
    });
    const { email, password } = bodySchema.parse(request.body);
    const user = await prisma.user.findFirst({
      where: { email }
    });
    if (!user) {
      throw new AppError("Invalid user or password.");
    }
    const equal = await (0, import_bcrypt.compare)(password, user.password);
    if (!equal) throw new AppError("Invalid user or password.");
    const { secret, expiresIn } = authConfig.jwt;
    const token = (0, import_jsonwebtoken.sign)({ role: user.role ?? "member" }, secret, {
      subject: user.id,
      expiresIn
    });
    response.json({ token });
  }
};
var sessionsController = new SessionsController();

// src/routes/sessions-routes.ts
var import_express = require("express");
var sessionsRouter = (0, import_express.Router)();
sessionsRouter.post("/", sessionsController.create);

// src/controllers/users-controller.ts
var import_zod3 = __toESM(require("zod"));
var import_bcrypt2 = require("bcrypt");
var import_client2 = require("@prisma/client");
var UsersController = class {
  async create(request, response, _) {
    const bodySchema = import_zod3.default.object({
      name: import_zod3.default.string(),
      email: import_zod3.default.string().email(),
      password: import_zod3.default.string()
      // Colocar restrições
    });
    const { name, email, password } = bodySchema.parse(request.body);
    const userExists = await prisma.user.findFirst({
      where: { email }
    });
    if (userExists) {
      throw new AppError("User already exists.", 400);
    }
    const password_hashed = await (0, import_bcrypt2.hash)(password, 8);
    const output = await prisma.user.create({
      data: { name, email, password: password_hashed }
    });
    const { password: p_, ...cleanUser } = output;
    response.status(201).json(cleanUser);
  }
  async index(request, response, _) {
    const users = await prisma.user.findMany({
      include: {
        teams: {
          select: {
            team: {
              select: { id: true, name: true }
            }
          }
        }
      }
    });
    const usersWithoutPassword = users.reduce((accumulated, current) => {
      const { password, ...userWithoutPassword } = current;
      const transform = {
        ...userWithoutPassword,
        teams: userWithoutPassword.teams.map((entry) => entry.team)
      };
      accumulated.push(transform);
      return accumulated;
    }, []);
    response.json(usersWithoutPassword);
  }
  async showTasks(request, response, _) {
    const id = import_zod3.default.string().parse(request.params.id);
    if (!request.user || request.user.role !== import_client2.Roles.admin && id !== request.user.id) {
      throw new AppError("Unauthorized", 401);
    }
    const userTasks = await prisma.user.findMany({
      select: {
        tasks: true
      },
      where: {
        id
      }
    });
    if (!userTasks[0]) {
      throw new AppError("User doest not exist. ");
    }
    response.json(userTasks[0].tasks);
  }
  async delete(request, response, _) {
    const id = import_zod3.default.string().parse(request.params.id);
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) throw new AppError("User doest not exist");
    const teamAssignment = (await prisma.teamMember.findMany({
      select: { id: true },
      where: { user_id: user.id }
    })).map((element) => element.id);
    if (teamAssignment) {
      await prisma.teamMember.deleteMany({
        where: {
          id: {
            in: teamAssignment
          }
        }
      });
    }
    await prisma.user.delete({ where: { id } });
    response.json();
  }
};
var usersController = new UsersController();

// src/middlewares/check-authorization.ts
function checkAuthorization(roles) {
  return (request, response, next) => {
    if (!request.user) throw new AppError("Unauthorized", 401);
    if (!roles.includes(request.user.role)) throw new AppError("Unauthorized", 401);
    next();
  };
}

// src/middlewares/ensure-authenticated.ts
var import_jsonwebtoken2 = require("jsonwebtoken");
async function ensureAuthenticated(request, response, next) {
  try {
    const auth = request.headers.authorization;
    const token = auth?.split(" ")[1];
    if (!token) {
      throw new AppError("Missing authorization token.");
    }
    const { secret } = authConfig.jwt;
    const { sub: userId, role } = (0, import_jsonwebtoken2.verify)(token, secret);
    const user = await prisma.user.findFirst({
      where: { id: userId }
    });
    request.user = {
      id: userId,
      role
    };
    next();
  } catch (error) {
    next(error);
  }
}

// src/routes/users-routes.ts
var import_client3 = require("@prisma/client");
var import_express2 = require("express");
var usersRouter = (0, import_express2.Router)();
usersRouter.use(ensureAuthenticated);
usersRouter.post("/", checkAuthorization([import_client3.Roles.admin]), usersController.create);
usersRouter.get("/", checkAuthorization([import_client3.Roles.admin]), usersController.index);
usersRouter.get("/:id/tasks", checkAuthorization([import_client3.Roles.admin, import_client3.Roles.member]), usersController.showTasks);
usersRouter.delete("/:id", checkAuthorization([import_client3.Roles.admin, import_client3.Roles.member]), usersController.delete);

// src/controllers/tasks-controller.ts
var import_zod4 = require("zod");
var import_client4 = require("@prisma/client");
var TasksController = class {
  async create(request, response, _) {
    const tasksSchema = import_zod4.z.object({
      title: import_zod4.z.string(),
      description: import_zod4.z.string(),
      status: import_zod4.z.enum([...Object.values(import_client4.Status)]),
      priority: import_zod4.z.enum([...Object.values(import_client4.Priority)]),
      user_id: import_zod4.z.string(),
      team_id: import_zod4.z.string()
    });
    const { title, description, status, priority, user_id, team_id } = tasksSchema.parse(request.body);
    const user = await prisma.user.findUnique({ where: { id: user_id } });
    if (!user) {
      throw new AppError("User doest not exist.");
    }
    const team = await prisma.team.findUnique({ where: { id: team_id } });
    if (!team) {
      throw new AppError("Team doest not exist.");
    }
    const taskCreated = await prisma.task.create({
      data: {
        title,
        description,
        status,
        priority,
        assigned_to: user_id,
        team_id
      }
    });
    response.status(201).json(taskCreated);
  }
  async index(request, response, _) {
    const tasks = await prisma.task.findMany();
    response.json(tasks);
  }
  async show(request, response, _) {
    const id = import_zod4.z.string().parse(request.params.id);
    const task = await prisma.task.findUnique({
      include: {
        taskHistory: true
      },
      where: { id }
    });
    if (!request.user) throw new AppError("Unauthorized.", 401);
    if (request.user.role !== import_client4.Roles.admin && task?.assigned_to !== request.user.id) throw new AppError("Unauthorized.", 401);
    if (!task) throw new AppError("Task does not exist.");
    response.json(task);
  }
  async partialUpdate(request, response, _) {
    const bodySchema = import_zod4.z.object({
      status: import_zod4.z.enum([...Object.values(import_client4.Status)]).optional(),
      priority: import_zod4.z.enum([...Object.values(import_client4.Priority)]).optional()
    });
    const id = import_zod4.z.string().parse(request.params.id);
    const { status, priority } = bodySchema.parse(request.body);
    if (!request.user) throw new AppError("Unauthorized.", 401);
    if (!status && !priority) {
      throw new AppError("Must inform status or priority.");
    }
    const task = await prisma.task.findUnique({
      where: { id }
    });
    if (!task) throw new AppError("Task does not exist");
    if (request.user.role !== import_client4.Roles.admin && task.assigned_to !== request.user.id) {
      throw new AppError("Unauthorized", 401);
    }
    if (status && task.status !== status) {
      await prisma.taskHistory.create({
        data: {
          task_id: task.id,
          changed_by: request.user.id,
          old_status: task.status,
          new_status: status
        }
      });
    }
    await prisma.task.update({
      data: {
        ...status && { status },
        ...priority && { priority }
      },
      where: {
        id
      }
    });
    response.json();
  }
  async delete(request, response, _) {
    const id = import_zod4.z.string().parse(request.params.id);
    const task = await prisma.task.findUnique({ where: { id } });
    if (!task) throw new AppError("Task doest not exist");
    await prisma.task.delete({ where: { id } });
    response.json();
  }
};
var tasksController = new TasksController();

// src/routes/tasks-routes.ts
var import_client5 = require("@prisma/client");
var import_express3 = require("express");
var tasksRouter = (0, import_express3.Router)();
tasksRouter.use(ensureAuthenticated);
tasksRouter.post("/", checkAuthorization([import_client5.Roles.admin]), tasksController.create);
tasksRouter.get("/", checkAuthorization([import_client5.Roles.admin]), tasksController.index);
tasksRouter.get("/:id", checkAuthorization([import_client5.Roles.admin, import_client5.Roles.member]), tasksController.show);
tasksRouter.delete("/:id", checkAuthorization([import_client5.Roles.admin, import_client5.Roles.member]), tasksController.delete);
tasksRouter.patch("/:id", checkAuthorization([import_client5.Roles.admin, import_client5.Roles.member]), tasksController.partialUpdate);

// src/controllers/teams-controller.ts
var import_client6 = require("@prisma/client");
var import_zod5 = __toESM(require("zod"));
var TeamsController = class {
  async create(request, response, _) {
    const bodySchema = import_zod5.default.object({
      name: import_zod5.default.string(),
      description: import_zod5.default.string()
    });
    const { name, description } = bodySchema.parse(request.body);
    const teamExists = await prisma.team.findFirst({
      where: {
        name: {
          equals: name,
          mode: "insensitive"
        }
      }
    });
    if (teamExists) {
      throw new AppError("Team already exists");
    }
    const createdTeam = await prisma.team.create({
      data: {
        name,
        description
      }
    });
    response.status(201).json(createdTeam);
  }
  async assignUser(request, response, _) {
    const userId = import_zod5.default.string().parse(request.body.user_id);
    const teamId = import_zod5.default.string().parse(request.params.id);
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new AppError("User does not exist.");
    }
    const team = await prisma.team.findUnique({ where: { id: teamId } });
    if (!team) {
      throw new AppError("Team does not exist.");
    }
    const assignmentExists = await prisma.teamMember.findFirst({
      where: { team_id: teamId, user_id: userId }
    });
    if (assignmentExists) {
      throw new AppError("User already belongs to this team.");
    }
    await prisma.teamMember.create({
      data: {
        team_id: teamId,
        user_id: userId
      }
    });
    response.json();
  }
  async index(request, response, _) {
    const teams = await prisma.team.findMany({
      include: {
        userMembers: {
          select: {
            user: { select: { id: true, name: true, email: true } }
          }
        }
      }
    });
    response.json(teams);
  }
  async showTasks(request, response, _) {
    const id = import_zod5.default.string().parse(request.params.id);
    const user = request.user;
    if (!user) throw new AppError("Unauthorized", 401);
    const userTeams = await prisma.teamMember.findMany({
      select: { team_id: true },
      where: { user_id: user.id }
    });
    const userTeamsList = userTeams.map((team) => team.team_id);
    if (!userTeamsList.includes(id) && user.role !== import_client6.Roles.admin) throw new AppError("Unauthorized", 401);
    const teamTasks = await prisma.team.findMany({
      select: {
        teamTask: true
      },
      where: {
        id
      }
    });
    if (!teamTasks[0]) {
      throw new AppError("Team doest not exist.");
    }
    response.json(teamTasks[0].teamTask);
  }
  async removeMember(request, response, _) {
    const paramsSchema = import_zod5.default.object({
      id: import_zod5.default.string(),
      user_id: import_zod5.default.string()
    });
    const { id, user_id } = paramsSchema.parse(request.params);
    const team = await prisma.team.findUnique({ where: { id } });
    if (!team) {
      throw new AppError("Team does not exist.");
    }
    const member = await prisma.teamMember.findUnique({
      where: { user_id_team_id: {
        team_id: id,
        user_id
      } }
    });
    if (!member) {
      throw new AppError("User does not exist or is not assigned to this team.");
    }
    await prisma.teamMember.delete({ where: { id: member.id } });
    response.json();
  }
  async delete(request, response, _) {
    const id = import_zod5.default.string().parse(request.params.id);
    const team = await prisma.team.findUnique({ where: { id } });
    if (!team) throw new AppError("Team doest not exist");
    const userAssignments = (await prisma.teamMember.findMany({
      select: { id: true },
      where: { team_id: team.id }
    })).map((element) => element.id);
    if (userAssignments) {
      await prisma.teamMember.deleteMany({
        where: {
          id: { in: userAssignments }
        }
      });
    }
    await prisma.team.delete({ where: { id } });
    response.json();
  }
};
var teamsController = new TeamsController();

// src/routes/teams-routes.ts
var import_client7 = require("@prisma/client");
var import_express4 = require("express");
var teamsRouter = (0, import_express4.Router)();
teamsRouter.use(ensureAuthenticated);
teamsRouter.post("/", checkAuthorization([import_client7.Roles.admin]), teamsController.create);
teamsRouter.get("/", checkAuthorization([import_client7.Roles.admin]), teamsController.index);
teamsRouter.post("/:id/member", checkAuthorization([import_client7.Roles.admin]), teamsController.assignUser);
teamsRouter.delete("/:id", checkAuthorization([import_client7.Roles.admin]), teamsController.delete);
teamsRouter.delete("/:id/member/:user_id", checkAuthorization([import_client7.Roles.admin]), teamsController.removeMember);
teamsRouter.get("/:id/tasks", checkAuthorization([import_client7.Roles.admin, import_client7.Roles.member]), teamsController.showTasks);

// src/routes/index.ts
var router = (0, import_express5.Router)();
router.use("/sessions", sessionsRouter);
router.use("/users", usersRouter);
router.use("/teams", teamsRouter);
router.use("/tasks", tasksRouter);

// src/middlewares/error-handling.ts
var import_zod6 = require("zod");
function errorHandling(error, request, response, _) {
  if (error instanceof AppError) {
    response.status(error.status).json({ message: error.message });
    return;
  }
  if (error instanceof import_zod6.ZodError) {
    response.status(400).json({ message: error.flatten() });
    return;
  }
  console.log(error);
  response.status(500).json({ message: error.message });
}

// src/app.ts
var app = (0, import_express6.default)();
app.use(import_express6.default.json());
app.use(router);
app.use(errorHandling);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  app
});
