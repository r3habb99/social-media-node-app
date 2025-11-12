import Joi from "joi";

/**
 * Schema for validating message search parameters
 */
export const messageSearchSchema = Joi.object({
  chatId: Joi.string()
    .regex(/^[0-9a-fA-F]{24}$/)
    .required()
    .messages({
      "string.base": "Chat ID must be a string",
      "string.empty": "Chat ID is required",
      "string.pattern.base": "Chat ID must be a valid MongoDB ObjectId",
      "any.required": "Chat ID is required",
    }),

  query: Joi.string()
    .trim()
    .min(1)
    .max(100)
    .required()
    .messages({
      "string.base": "Search query must be a string",
      "string.empty": "Search query cannot be empty",
      "string.min": "Search query must be at least 1 character long",
      "string.max": "Search query cannot exceed 100 characters",
      "any.required": "Search query is required",
    }),

  limit: Joi.number()
    .integer()
    .min(1)
    .max(50)
    .optional()
    .default(20)
    .messages({
      "number.base": "Limit must be a number",
      "number.integer": "Limit must be an integer",
      "number.min": "Limit must be at least 1",
      "number.max": "Limit cannot exceed 50",
    }),

  skip: Joi.number()
    .integer()
    .min(0)
    .optional()
    .default(0)
    .messages({
      "number.base": "Skip must be a number",
      "number.integer": "Skip must be an integer",
      "number.min": "Skip cannot be negative",
    }),

  sortBy: Joi.string()
    .valid("createdAt", "updatedAt")
    .optional()
    .default("createdAt")
    .messages({
      "any.only": "Sort by must be either 'createdAt' or 'updatedAt'",
    }),

  sortOrder: Joi.string()
    .valid("asc", "desc")
    .optional()
    .default("desc")
    .messages({
      "any.only": "Sort order must be either 'asc' or 'desc'",
    }),
});

/**
 * Schema for validating query parameters (used with validateRequest middleware)
 */
export const messageSearchQuerySchema = Joi.object({
  chatId: Joi.string()
    .regex(/^[0-9a-fA-F]{24}$/)
    .required()
    .messages({
      "string.base": "Chat ID must be a string",
      "string.empty": "Chat ID is required",
      "string.pattern.base": "Chat ID must be a valid MongoDB ObjectId",
      "any.required": "Chat ID is required",
    }),

  query: Joi.string()
    .trim()
    .min(1)
    .max(100)
    .required()
    .messages({
      "string.base": "Search query must be a string",
      "string.empty": "Search query cannot be empty",
      "string.min": "Search query must be at least 1 character long",
      "string.max": "Search query cannot exceed 100 characters",
      "any.required": "Search query is required",
    }),

  limit: Joi.string()
    .regex(/^\d+$/)
    .optional()
    .messages({
      "string.pattern.base": "Limit must be a valid number",
    }),

  skip: Joi.string()
    .regex(/^\d+$/)
    .optional()
    .messages({
      "string.pattern.base": "Skip must be a valid number",
    }),

  sortBy: Joi.string()
    .valid("createdAt", "updatedAt")
    .optional()
    .messages({
      "any.only": "Sort by must be either 'createdAt' or 'updatedAt'",
    }),

  sortOrder: Joi.string()
    .valid("asc", "desc")
    .optional()
    .messages({
      "any.only": "Sort order must be either 'asc' or 'desc'",
    }),
});
