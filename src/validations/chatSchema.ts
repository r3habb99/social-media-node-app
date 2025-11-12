import Joi from "joi";

// Schema for creating an individual chat
export const createChatSchema = Joi.object({
  userId: Joi.string().required().messages({
    "string.empty": "User ID is required",
    "any.required": "User ID is required",
  }),
});

// Custom validation function for duplicate users
const validateUniqueUsers = (users: string[]) => {
  const uniqueUsers = new Set(users);
  return uniqueUsers.size === users.length;
};

// Schema for creating a group chat
export const createGroupChatSchema = Joi.object({
  users: Joi.array()
    .items(
      Joi.string()
        .regex(/^[0-9a-fA-F]{24}$/)
        .messages({
          "string.pattern.base": "Each user ID must be a valid MongoDB ObjectId",
        })
    )
    .min(1) // Changed from 2 to 1 since creator is auto-added
    .max(49) // Changed from 50 to 49 since creator will be added (total max 50)
    .custom((value, helpers) => {
      if (!validateUniqueUsers(value)) {
        return helpers.error('array.unique');
      }
      return value;
    })
    .required()
    .messages({
      "array.min": "A group chat requires at least 1 other user (creator is automatically added)",
      "array.max": "A group chat cannot have more than 49 other users (50 total including creator)",
      "array.base": "Users must be an array",
      "array.unique": "Duplicate users are not allowed in the group",
      "any.required": "Users are required",
    }),
  chatName: Joi.string()
    .trim()
    .min(1)
    .max(100)
    .required()
    .messages({
      "string.empty": "Chat name is required",
      "string.min": "Chat name must be at least 1 character long",
      "string.max": "Chat name cannot exceed 100 characters",
      "any.required": "Chat name is required",
    }),
});

// Schema for sending a message
export const sendMessageSchema = Joi.object({
  content: Joi.string().required().messages({
    "string.empty": "Message content is required",
    "any.required": "Message content is required",
  }),
});

// Schema for adding a user to a group
export const addUserToGroupSchema = Joi.object({
  chatId: Joi.string()
    .regex(/^[0-9a-fA-F]{24}$/)
    .required()
    .messages({
      "string.empty": "Chat ID is required",
      "string.pattern.base": "Chat ID must be a valid MongoDB ObjectId",
      "any.required": "Chat ID is required",
    }),
  userId: Joi.string()
    .regex(/^[0-9a-fA-F]{24}$/)
    .required()
    .messages({
      "string.empty": "User ID is required",
      "string.pattern.base": "User ID must be a valid MongoDB ObjectId",
      "any.required": "User ID is required",
    }),
});

// Schema for removing a user from a group
export const removeUserFromGroupSchema = Joi.object({
  chatId: Joi.string()
    .regex(/^[0-9a-fA-F]{24}$/)
    .required()
    .messages({
      "string.empty": "Chat ID is required",
      "string.pattern.base": "Chat ID must be a valid MongoDB ObjectId",
      "any.required": "Chat ID is required",
    }),
  userId: Joi.string()
    .regex(/^[0-9a-fA-F]{24}$/)
    .required()
    .messages({
      "string.empty": "User ID is required",
      "string.pattern.base": "User ID must be a valid MongoDB ObjectId",
      "any.required": "User ID is required",
    }),
});

// Schema for updating a group chat name
export const updateGroupNameSchema = Joi.object({
  chatId: Joi.string()
    .regex(/^[0-9a-fA-F]{24}$/)
    .required()
    .messages({
      "string.empty": "Chat ID is required",
      "string.pattern.base": "Chat ID must be a valid MongoDB ObjectId",
      "any.required": "Chat ID is required",
    }),
  chatName: Joi.string()
    .trim()
    .min(1)
    .max(100)
    .required()
    .messages({
      "string.empty": "Chat name is required",
      "string.min": "Chat name must be at least 1 character long",
      "string.max": "Chat name cannot exceed 100 characters",
      "any.required": "Chat name is required",
    }),
});

// Schema for archiving a chat
export const archiveChatSchema = Joi.object({
  chatId: Joi.string().required().messages({
    "string.empty": "Chat ID is required",
    "any.required": "Chat ID is required",
  }),
});
