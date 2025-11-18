import Joi from "joi";

/**
 * Schema for creating a new message
 * Content is optional if media is provided
 */
export const createMessageSchema = Joi.object({
  content: Joi.string()
    .trim()
    .max(5000)
    .optional()
    .allow("")
    .messages({
      "string.base": "Content must be a string",
      "string.max": "Content cannot exceed 5000 characters",
    }),

  chatId: Joi.string()
    .regex(/^[0-9a-fA-F]{24}$/)
    .optional() // Made optional since it might be in FormData
    .messages({
      "string.empty": "Chat ID is required",
      "string.pattern.base": "Chat ID must be a valid MongoDB ObjectId",
    }),

  messageType: Joi.string()
    .valid("text", "image", "video", "file", "audio", "system")
    .optional()
    .messages({
      "any.only": "Message type must be one of: text, image, video, file, audio, system",
    }),

  media: Joi.array()
    .items(Joi.string())
    .max(5)
    .optional()
    .messages({
      "array.base": "Media must be an array",
      "array.max": "Cannot upload more than 5 media files",
    }),

  replyToId: Joi.string()
    .regex(/^[0-9a-fA-F]{24}$/)
    .optional()
    .messages({
      "string.pattern.base": "Reply to ID must be a valid MongoDB ObjectId",
    }),

  // Fields added by multer middleware
  originalFileName: Joi.string().optional(),
  uploadedFileName: Joi.string().optional(),
}).unknown(true); // Allow unknown fields to support multer's file handling

/**
 * Schema for editing a message
 */
export const editMessageSchema = Joi.object({
  content: Joi.string()
    .trim()
    .max(5000)
    .optional()
    .allow("")
    .messages({
      "string.base": "Content must be a string",
      "string.max": "Content cannot exceed 5000 characters",
    }),

  chatId: Joi.string()
    .regex(/^[0-9a-fA-F]{24}$/)
    .required()
    .messages({
      "string.empty": "Chat ID is required",
      "string.pattern.base": "Chat ID must be a valid MongoDB ObjectId",
      "any.required": "Chat ID is required",
    }),

  media: Joi.array()
    .items(Joi.string())
    .max(5)
    .optional()
    .messages({
      "array.base": "Media must be an array",
      "array.max": "Cannot upload more than 5 media files",
    }),

  // Fields added by multer middleware
  originalFileName: Joi.string().optional(),
  uploadedFileName: Joi.string().optional(),
}).unknown(true); // Allow unknown fields to support multer's file handling

/**
 * Schema for deleting a message
 */
export const deleteMessageSchema = Joi.object({
  chatId: Joi.string()
    .regex(/^[0-9a-fA-F]{24}$/)
    .required()
    .messages({
      "string.empty": "Chat ID is required",
      "string.pattern.base": "Chat ID must be a valid MongoDB ObjectId",
      "any.required": "Chat ID is required",
    }),
});

