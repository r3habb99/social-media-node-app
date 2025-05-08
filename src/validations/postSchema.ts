import Joi from "joi";

// Post Validation Schema
export const postSchema = Joi.object({
  content: Joi.string().trim().min(1).max(280).optional().messages({
    "string.base": "Content must be a string",
    "string.empty": "Content cannot be empty",
    "string.min": "Content must be at least 1 character long",
    "string.max": "Content cannot exceed 280 characters",
  }),

  media: Joi.array()
    .items(
      Joi.string()
        .uri()
        .messages({ "string.uri": "Each media item must be a valid URL" })
    )
    .optional(),

  visibility: Joi.string()
    .valid("public", "private", "followers")
    .default("public")
    .messages({
      "any.only":
        "Visibility must be either 'public', 'private', or 'followers'",
    }),

  isReply: Joi.boolean().optional(),

  search: Joi.string().optional(),

  // Fields added by multer middleware
  originalFileName: Joi.string().optional(),
  uploadedFileName: Joi.string().optional(),
}).unknown(true); // Allow unknown fields to support multer's file handling

// Post Update Validation Schema
export const updatePostSchema = Joi.object({
  content: Joi.string().trim().min(1).max(280).optional().messages({
    "string.base": "Content must be a string",
    "string.empty": "Content cannot be empty",
    "string.min": "Content must be at least 1 character long",
    "string.max": "Content cannot exceed 280 characters",
  }),

  media: Joi.array()
    .items(
      Joi.string()
        .uri()
        .messages({ "string.uri": "Each media item must be a valid URL" })
    )
    .optional(),

  visibility: Joi.string()
    .valid("public", "private", "followers")
    .optional()
    .messages({
      "any.only":
        "Visibility must be either 'public', 'private', or 'followers'",
    }),

  // Fields added by multer middleware
  originalFileName: Joi.string().optional(),
  uploadedFileName: Joi.string().optional(),
})
.min(1) // Require at least one field to be present
.unknown(true); // Allow unknown fields to support multer's file handling
