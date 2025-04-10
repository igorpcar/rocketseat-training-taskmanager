"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
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
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/routes/tasks-routes.ts
var tasks_routes_exports = {};
__export(tasks_routes_exports, {
  tasksRouter: () => tasksRouter
});
module.exports = __toCommonJS(tasks_routes_exports);

// src/controllers/tasks-controller.ts
var import_zod = require("zod");
var import_client2 = require("@prisma/client");

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

// src/controllers/tasks-controller.ts
var TasksController = class {
  async create(request, response, _) {
    const tasksSchema = import_zod.z.object({
      title: import_zod.z.string(),
      description: import_zod.z.string(),
      status: import_zod.z.enum([...Object.values(import_client2.Status)]),
      priority: import_zod.z.enum([...Object.values(import_client2.Priority)]),
      user_id: import_zod.z.string(),
      team_id: import_zod.z.string()
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
    const id = import_zod.z.string().parse(request.params.id);
    const task = await prisma.task.findUnique({
      include: {
        taskHistory: true
      },
      where: { id }
    });
    if (!request.user) throw new AppError("Unauthorized.", 401);
    if (request.user.role !== import_client2.Roles.admin && task?.assigned_to !== request.user.id) throw new AppError("Unauthorized.", 401);
    if (!task) throw new AppError("Task does not exist.");
    response.json(task);
  }
  async partialUpdate(request, response, _) {
    const bodySchema = import_zod.z.object({
      status: import_zod.z.enum([...Object.values(import_client2.Status)]).optional(),
      priority: import_zod.z.enum([...Object.values(import_client2.Priority)]).optional()
    });
    const id = import_zod.z.string().parse(request.params.id);
    const { status, priority } = bodySchema.parse(request.body);
    if (!request.user) throw new AppError("Unauthorized.", 401);
    if (!status && !priority) {
      throw new AppError("Must inform status or priority.");
    }
    const task = await prisma.task.findUnique({
      where: { id }
    });
    if (!task) throw new AppError("Task does not exist");
    if (request.user.role !== import_client2.Roles.admin && task.assigned_to !== request.user.id) {
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
    const id = import_zod.z.string().parse(request.params.id);
    const task = await prisma.task.findUnique({ where: { id } });
    if (!task) throw new AppError("Task doest not exist");
    await prisma.task.delete({ where: { id } });
    response.json();
  }
};
var tasksController = new TasksController();

// src/middlewares/check-authorization.ts
function checkAuthorization(roles) {
  return (request, response, next) => {
    if (!request.user) throw new AppError("Unauthorized", 401);
    if (!roles.includes(request.user.role)) throw new AppError("Unauthorized", 401);
    next();
  };
}

// src/middlewares/ensure-authenticated.ts
var import_jsonwebtoken = require("jsonwebtoken");

// src/env.ts
var import_zod2 = require("zod");
var envSchema = import_zod2.z.object({
  DATABASE_URL: import_zod2.z.string(),
  JWT_SECRET: import_zod2.z.string(),
  PORT: import_zod2.z.coerce.number().default(3333)
});
var env = envSchema.parse(process.env);

// src/config/auth.ts
var authConfig = {
  jwt: {
    secret: env.JWT_SECRET,
    expiresIn: "1d"
  }
};

// src/middlewares/ensure-authenticated.ts
async function ensureAuthenticated(request, response, next) {
  try {
    const auth = request.headers.authorization;
    const token = auth?.split(" ")[1];
    if (!token) {
      throw new AppError("Missing authorization token.");
    }
    const { secret } = authConfig.jwt;
    const { sub: userId, role } = (0, import_jsonwebtoken.verify)(token, secret);
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

// src/routes/tasks-routes.ts
var import_client3 = require("@prisma/client");
var import_express = require("express");
var tasksRouter = (0, import_express.Router)();
tasksRouter.use(ensureAuthenticated);
tasksRouter.post("/", checkAuthorization([import_client3.Roles.admin]), tasksController.create);
tasksRouter.get("/", checkAuthorization([import_client3.Roles.admin]), tasksController.index);
tasksRouter.get("/:id", checkAuthorization([import_client3.Roles.admin, import_client3.Roles.member]), tasksController.show);
tasksRouter.delete("/:id", checkAuthorization([import_client3.Roles.admin, import_client3.Roles.member]), tasksController.delete);
tasksRouter.patch("/:id", checkAuthorization([import_client3.Roles.admin, import_client3.Roles.member]), tasksController.partialUpdate);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  tasksRouter
});
