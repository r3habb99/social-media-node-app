import Joi from "joi";

// Schema for creating an individual chat
export const createChatSchema = Joi.object({
  userId: Joi.string().required().messages({
    "string.empty": "User ID is required",
    "any.required": "User ID is required",
  }),
});

// Schema for creating a group chat
export const createGroupChatSchema = Joi.object({
  users: Joi.array().items(Joi.string()).min(2).required().messages({
    "array.min": "A group chat requires at least 2 users",
    "array.base": "Users must be an array",
    "any.required": "Users are required",
  }),
  chatName: Joi.string().required().messages({
    "string.empty": "Chat name is required",
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
  chatId: Joi.string().required().messages({
    "string.empty": "Chat ID is required",
    "any.required": "Chat ID is required",
  }),
  userId: Joi.string().required().messages({
    "string.empty": "User ID is required",
    "any.required": "User ID is required",
  }),
});

// Schema for removing a user from a group
export const removeUserFromGroupSchema = Joi.object({
  chatId: Joi.string().required().messages({
    "string.empty": "Chat ID is required",
    "any.required": "Chat ID is required",
  }),
  userId: Joi.string().required().messages({
    "string.empty": "User ID is required",
    "any.required": "User ID is required",
  }),
});

// Schema for updating a group chat name
export const updateGroupNameSchema = Joi.object({
  chatId: Joi.string().required().messages({
    "string.empty": "Chat ID is required",
    "any.required": "Chat ID is required",
  }),
  chatName: Joi.string().required().messages({
    "string.empty": "Chat name is required",
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
