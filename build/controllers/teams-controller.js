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

// src/controllers/teams-controller.ts
var teams_controller_exports = {};
__export(teams_controller_exports, {
  teamsController: () => teamsController
});
module.exports = __toCommonJS(teams_controller_exports);

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

// src/controllers/teams-controller.ts
var import_client2 = require("@prisma/client");
var import_zod = __toESM(require("zod"));
var TeamsController = class {
  async create(request, response, _) {
    const bodySchema = import_zod.default.object({
      name: import_zod.default.string(),
      description: import_zod.default.string()
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
    const userId = import_zod.default.string().parse(request.body.user_id);
    const teamId = import_zod.default.string().parse(request.params.id);
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
    const id = import_zod.default.string().parse(request.params.id);
    const user = request.user;
    if (!user) throw new AppError("Unauthorized", 401);
    const userTeams = await prisma.teamMember.findMany({
      select: { team_id: true },
      where: { user_id: user.id }
    });
    const userTeamsList = userTeams.map((team) => team.team_id);
    if (!userTeamsList.includes(id) && user.role !== import_client2.Roles.admin) throw new AppError("Unauthorized", 401);
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
    const paramsSchema = import_zod.default.object({
      id: import_zod.default.string(),
      user_id: import_zod.default.string()
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
    const id = import_zod.default.string().parse(request.params.id);
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
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  teamsController
});
