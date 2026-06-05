// Centralized middleware exports.
// Import any middleware from this single file:
//   import { asyncHandler, validate, requireAuth, requireAdmin, errorHandler } from "../middleware/index.js";

export { asyncHandler } from "./asyncHandler.js";
export { validate } from "./validate.js";
export { requireAuth, requireAdmin } from "./auth.js";
export { errorHandler } from "./errorHandler.js";
