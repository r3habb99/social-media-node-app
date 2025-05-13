import Joi from "joi";

// Comment Creation Schema
export const createCommentSchema = Joi.object({
  postId: Joi.string()
    .regex(/^[0-9a-fA-F]{24}$/)
    .required()
    .messages({
      "string.empty": "Post ID is required",
      "string.pattern.base": "Post ID must be a valid MongoDB ObjectId",
      "any.required": "Post ID is required",
    }),

  content: Joi.string()
    .trim()
    .min(1)
    .max(1000)
    .required()
    .messages({
      "string.base": "Content must be a string",
      "string.empty": "Content is required",
      "string.min": "Content must be at least 1 character long",
      "string.max": "Content cannot exceed 1000 characters",
      "any.required": "Content is required",
    }),

  replyToId: Joi.string()
    .regex(/^[0-9a-fA-F]{24}$/)
    .optional()
    .messages({
      "string.pattern.base": "Reply to ID must be a valid MongoDB ObjectId",
    }),
});

// Comment Update Schema
export const updateCommentSchema = Joi.object({
  content: Joi.string()
    .trim()
    .min(1)
    .max(1000)
    .required()
    .messages({
      "string.base": "Content must be a string",
      "string.empty": "Content is required",
      "string.min": "Content must be at least 1 character long",
      "string.max": "Content cannot exceed 1000 characters",
      "any.required": "Content is required",
    }),
});

// Comment Pagination Schema
export const commentPaginationSchema = Joi.object({
  page: Joi.number()
    .integer()
    .min(1)
    .default(1)
    .messages({
      "number.base": "Page must be a number",
      "number.integer": "Page must be an integer",
      "number.min": "Page must be at least 1",
    }),

  limit: Joi.number()
    .integer()
    .min(1)
    .max(100)
    .default(10)
    .messages({
      "number.base": "Limit must be a number",
      "number.integer": "Limit must be an integer",
      "number.min": "Limit must be at least 1",
      "number.max": "Limit cannot exceed 100",
    }),

  parentOnly: Joi.boolean()
    .default(true)
    .messages({
      "boolean.base": "ParentOnly must be a boolean",
    }),
});
