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

// src/routes/users-routes.ts
var users_routes_exports = {};
__export(users_routes_exports, {
  usersRouter: () => usersRouter
});
module.exports = __toCommonJS(users_routes_exports);

// src/utils/AppError.ts
var AppError = class {
  message;
  status;
  constructor(message, status = 400) {
    this.message = message;
    this.status = status;
  }
};

// src/database/prisma.ts
var import_client = require("@prisma/client");
var prisma = new import_client.PrismaClient({});

// src/controllers/users-controller.ts
var import_zod = __toESM(require("zod"));
var import_bcrypt = require("bcrypt");
var import_client2 = require("@prisma/client");
var UsersController = class {
  async create(request, response, _) {
    const bodySchema = import_zod.default.object({
      name: import_zod.default.string(),
      email: import_zod.default.string().email(),
      password: import_zod.default.string()
      // Colocar restrições
    });
    const { name, email, password } = bodySchema.parse(request.body);
    const userExists = await prisma.user.findFirst({
      where: { email }
    });
    if (userExists) {
      throw new AppError("User already exists.", 400);
    }
    const password_hashed = await (0, import_bcrypt.hash)(password, 8);
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
    const id = import_zod.default.string().parse(request.params.id);
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
    const id = import_zod.default.string().parse(request.params.id);
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

// src/routes/users-routes.ts
var import_client3 = require("@prisma/client");
var import_express = require("express");
var usersRouter = (0, import_express.Router)();
usersRouter.use(ensureAuthenticated);
usersRouter.post("/", checkAuthorization([import_client3.Roles.admin]), usersController.create);
usersRouter.get("/", checkAuthorization([import_client3.Roles.admin]), usersController.index);
usersRouter.get("/:id/tasks", checkAuthorization([import_client3.Roles.admin, import_client3.Roles.member]), usersController.showTasks);
usersRouter.delete("/:id", checkAuthorization([import_client3.Roles.admin, import_client3.Roles.member]), usersController.delete);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  usersRouter
});
