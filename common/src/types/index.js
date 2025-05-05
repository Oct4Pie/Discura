"use strict";
/**
 * Common Types
 *
 * This is the main entry point for all shared type definitions
 * between frontend and backend.
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LLMProvider = exports.BotStatus = void 0;
// Export domain types
var BotStatus;
(function (BotStatus) {
    BotStatus["OFFLINE"] = "offline";
    BotStatus["ONLINE"] = "online";
    BotStatus["ERROR"] = "error";
})(BotStatus || (exports.BotStatus = BotStatus = {}));
var LLMProvider;
(function (LLMProvider) {
    LLMProvider["OPENAI"] = "openai";
    LLMProvider["ANTHROPIC"] = "anthropic";
    LLMProvider["GOOGLE"] = "google";
    LLMProvider["CUSTOM"] = "custom";
})(LLMProvider || (exports.LLMProvider = LLMProvider = {}));
// Export the common types
__exportStar(require("./api"), exports); // Assuming api.ts exports the necessary types
// Export the schema-generated types
__exportStar(require("../schema/types"), exports);
//# sourceMappingURL=index.js.map