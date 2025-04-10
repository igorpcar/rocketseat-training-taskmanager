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

// src/middlewares/check-authorization.ts
var check_authorization_exports = {};
__export(check_authorization_exports, {
  checkAuthorization: () => checkAuthorization
});
module.exports = __toCommonJS(check_authorization_exports);

// src/utils/AppError.ts
var AppError = class {
  message;
  status;
  constructor(message, status = 400) {
    this.message = message;
    this.status = status;
  }
};

// src/middlewares/check-authorization.ts
function checkAuthorization(roles) {
  return (request, response, next) => {
    if (!request.user) throw new AppError("Unauthorized", 401);
    if (!roles.includes(request.user.role)) throw new AppError("Unauthorized", 401);
    next();
  };
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  checkAuthorization
});
