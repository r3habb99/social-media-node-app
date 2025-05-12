import mongoose from "mongoose";
import { Message } from "../entities";
import { logger } from "../services";
import { transformMessagesMediaUrls, transformMessageMediaUrls } from "../utils/messageMediaUrl";

/**
 * Save a new message
 */
export const saveMessage = async (senderId: string, content: string, chatId: string) => {
  try {
    const message = await Message.create({
      sender: senderId,
      content,
      chat: chatId,
    });

    // Populate the sender to get their profile picture
    await message.populate("sender", "-password");

    // Transform profile picture URL to full URL
    return transformMessageMediaUrls(message);
  } catch (error) {
    logger.error("Error saving message", error);
    throw error;
  }
};

/**
 * Mark a message as read by a user
 */
export const markMessageAsRead = async (messageId: string, userId: string) => {
  try {
    const message = await Message.findById(new mongoose.Types.ObjectId(messageId));
    if (!message) {
      throw new Error("Message not found");
    }
    const userObjectId = new mongoose.Types.ObjectId(userId);
    if (!message.readBy.some((id) => id.equals(userObjectId))) {
      message.readBy.push(userObjectId);
      await message.save();
    }
    return message;
  } catch (error) {
    logger.error("Error marking message as read", error);
    throw error;
  }
};

/**
 * Delete a message (soft delete)
 */
export const deleteMessageById = async (messageId: string) => {
  try {
    const message = await Message.findById(new mongoose.Types.ObjectId(messageId));
    if (!message) {
      throw new Error("Message not found");
    }
    message.isDeleted = true;
    message.deletedAt = new Date();
    await message.save();
  } catch (error) {
    logger.error("Error deleting message", error);
    throw error;
  }
};

/**
 * Edit a message content
 */
export const editMessageById = async (messageId: string, content: string) => {
  try {
    const message = await Message.findById(new mongoose.Types.ObjectId(messageId));
    if (!message) {
      throw new Error("Message not found");
    }
    message.content = content;
    message.updatedAt = new Date();
    await message.save();
    return message;
  } catch (error) {
    logger.error("Error editing message", error);
    throw error;
  }
};

/**
 * Get messages with pagination
 */
export const getMessages = async (chatId: string, limit = 20, skip = 0) => {
  try {
    const messages = await Message.find({ chat: chatId, isDeleted: false })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("sender", "-password");

    // Transform profile picture URLs to full URLs
    return transformMessagesMediaUrls(messages);
  } catch (error) {
    logger.error("Error fetching messages", error);
    throw error;
  }
};

/**
 * Search messages by content or sender
 */
export const searchMessages = async (chatId: string, query: string) => {
  try {
    const regex = new RegExp(query, "i");
    const messages = await Message.find({
      chat: chatId,
      isDeleted: false,
      $or: [{ content: regex }],
    }).populate("sender", "-password");

    // Transform profile picture URLs to full URLs
    return transformMessagesMediaUrls(messages);
  } catch (error) {
    logger.error("Error searching messages", error);
    throw error;
  }
};
