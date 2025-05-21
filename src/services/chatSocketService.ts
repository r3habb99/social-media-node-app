import { Server } from "socket.io";
import { logger } from "./logger";
import { transformMessageMediaUrls } from "../utils/messageMediaUrl";
import { transformChatMediaUrls } from "../utils/chatMediaUrl";
import { getFullMediaUrl } from "../utils/mediaUrl";

// Socket.io server instance
let io: Server;

/**
 * Set the Socket.io instance - should be called once from app.ts
 * @param socketIo - The Socket.io server instance
 */
export const setSocketInstance = (socketIo: Server) => {
  io = socketIo;
  logger.info("Socket.io instance set in chat socket service");
};

/**
 * Get the Socket.io instance
 * @returns The Socket.io server instance or null if not set
 */
export const getSocketInstance = (): Server | null => {
  return io || null;
};

/**
 * Ensures all media URLs in an object are properly transformed to full URLs
 * This is a safety check to make sure we never send relative URLs to clients
 */
const ensureFullMediaUrls = (obj: any): any => {
  if (!obj) return obj;
  
  // If it's not an object, return as is
  if (typeof obj !== 'object') return obj;
  
  // If it's an array, process each item
  if (Array.isArray(obj)) {
    return obj.map(item => ensureFullMediaUrls(item));
  }
  
  // Create a new object to avoid modifying the original
  const result = { ...obj };
  
  // Process each property
  for (const key in result) {
    const value = result[key];
    
    // Check if this is a media URL field
    if ((key === 'profilePic' || key === 'coverPhoto' || key === 'media') && typeof value === 'string') {
      // Transform the URL if it's not already a full URL
      result[key] = getFullMediaUrl(value);
    } 
    // If it's an array of media URLs
    else if (key === 'media' && Array.isArray(value)) {
      result[key] = value.map((url: string) => 
        typeof url === 'string' ? getFullMediaUrl(url) : url
      );
    }
    // Recursively process nested objects
    else if (typeof value === 'object' && value !== null) {
      result[key] = ensureFullMediaUrls(value);
    }
  }
  
  return result;
};

/**
 * Emit a new message event to all users in a chat
 * @param chatId - The chat ID
 * @param message - The message object
 * @returns True if the event was emitted successfully, false otherwise
 */
export const emitNewMessage = (chatId: string, message: any) => {
  if (!io) {
    logger.warn("Socket.io instance not set, cannot emit new message");
    return false;
  }
  
  try {
    // Ensure all media URLs are properly transformed
    const transformedMessage = ensureFullMediaUrls(message);
    
    // Emit the message to all users in the chat
    io.to(chatId).emit("message received", {
      ...transformedMessage,
      status: "delivered"
    });
    
    logger.info(`Emitted new message to chat ${chatId}`);
    return true;
  } catch (error) {
    logger.error(`Error emitting new message: ${error}`);
    return false;
  }
};

/**
 * Emit a chat updated event to all users in a chat
 * @param chatId - The chat ID
 * @param chat - The updated chat object
 * @returns True if the event was emitted successfully, false otherwise
 */
export const emitChatUpdated = (chatId: string, chat: any) => {
  if (!io) {
    logger.warn("Socket.io instance not set, cannot emit chat update");
    return false;
  }
  
  try {
    // Ensure all media URLs are properly transformed
    const transformedChat = ensureFullMediaUrls(chat);
    
    // Emit the chat update to all users in the chat
    io.to(chatId).emit("chat updated", transformedChat);
    
    logger.info(`Emitted chat update to chat ${chatId}`);
    return true;
  } catch (error) {
    logger.error(`Error emitting chat update: ${error}`);
    return false;
  }
};

/**
 * Emit a message deleted event to all users in a chat
 * @param chatId - The chat ID
 * @param messageId - The ID of the deleted message
 * @returns True if the event was emitted successfully, false otherwise
 */
export const emitMessageDeleted = (chatId: string, messageId: string) => {
  if (!io) {
    logger.warn("Socket.io instance not set, cannot emit message deleted");
    return false;
  }
  
  try {
    // Emit the message deleted event to all users in the chat
    io.to(chatId).emit("message deleted", {
      messageId,
      chatId,
      deletedAt: new Date()
    });
    
    logger.info(`Emitted message deleted event for message ${messageId} in chat ${chatId}`);
    return true;
  } catch (error) {
    logger.error(`Error emitting message deleted: ${error}`);
    return false;
  }
};

/**
 * Emit a message edited event to all users in a chat
 * @param chatId - The chat ID
 * @param message - The edited message object
 * @returns True if the event was emitted successfully, false otherwise
 */
export const emitMessageEdited = (chatId: string, message: any) => {
  if (!io) {
    logger.warn("Socket.io instance not set, cannot emit message edited");
    return false;
  }
  
  try {
    // Ensure all media URLs are properly transformed
    const transformedMessage = ensureFullMediaUrls(message);
    
    // Emit the message edited event to all users in the chat
    io.to(chatId).emit("message edited", transformedMessage);
    
    logger.info(`Emitted message edited event for message ${message._id || message.id} in chat ${chatId}`);
    return true;
  } catch (error) {
    logger.error(`Error emitting message edited: ${error}`);
    return false;
  }
};

/**
 * Emit a user added to group event to all users in a chat
 * @param chatId - The chat ID
 * @param userId - The ID of the user who was added
 * @param chat - The updated chat object
 * @returns True if the event was emitted successfully, false otherwise
 */
export const emitUserAddedToGroup = (chatId: string, userId: string, chat: any) => {
  if (!io) {
    logger.warn("Socket.io instance not set, cannot emit user added to group");
    return false;
  }
  
  try {
    // Ensure all media URLs are properly transformed
    const transformedChat = ensureFullMediaUrls(chat);
    
    // Emit the user added event to all users in the chat
    io.to(chatId).emit("user added to group", {
      chat: transformedChat,
      userId,
      timestamp: new Date()
    });
    
    logger.info(`Emitted user added to group event for user ${userId} in chat ${chatId}`);
    return true;
  } catch (error) {
    logger.error(`Error emitting user added to group: ${error}`);
    return false;
  }
};

/**
 * Emit a user removed from group event to all users in a chat
 * @param chatId - The chat ID
 * @param userId - The ID of the user who was removed
 * @param chat - The updated chat object
 * @returns True if the event was emitted successfully, false otherwise
 */
export const emitUserRemovedFromGroup = (chatId: string, userId: string, chat: any) => {
  if (!io) {
    logger.warn("Socket.io instance not set, cannot emit user removed from group");
    return false;
  }
  
  try {
    // Ensure all media URLs are properly transformed
    const transformedChat = ensureFullMediaUrls(chat);
    
    // Emit the user removed event to all users in the chat
    io.to(chatId).emit("user removed from group", {
      chat: transformedChat,
      userId,
      timestamp: new Date()
    });
    
    logger.info(`Emitted user removed from group event for user ${userId} in chat ${chatId}`);
    return true;
  } catch (error) {
    logger.error(`Error emitting user removed from group: ${error}`);
    return false;
  }
};

/**
 * Emit a group name updated event to all users in a chat
 * @param chatId - The chat ID
 * @param newName - The new name of the group
 * @param chat - The updated chat object
 * @returns True if the event was emitted successfully, false otherwise
 */
export const emitGroupNameUpdated = (chatId: string, newName: string, chat: any) => {
  if (!io) {
    logger.warn("Socket.io instance not set, cannot emit group name updated");
    return false;
  }
  
  try {
    // Ensure all media URLs are properly transformed
    const transformedChat = ensureFullMediaUrls(chat);
    
    // Emit the group name updated event to all users in the chat
    io.to(chatId).emit("group name updated", {
      chat: transformedChat,
      newName,
      timestamp: new Date()
    });
    
    logger.info(`Emitted group name updated event for chat ${chatId}`);
    return true;
  } catch (error) {
    logger.error(`Error emitting group name updated: ${error}`);
    return false;
  }
};
