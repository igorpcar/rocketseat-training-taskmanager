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

// src/middlewares/ensure-authenticated.ts
var ensure_authenticated_exports = {};
__export(ensure_authenticated_exports, {
  ensureAuthenticated: () => ensureAuthenticated
});
module.exports = __toCommonJS(ensure_authenticated_exports);
var import_jsonwebtoken = require("jsonwebtoken");

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
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  ensureAuthenticated
});
