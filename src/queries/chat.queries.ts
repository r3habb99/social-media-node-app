import mongoose from "mongoose";
import { Chat, Message } from "../entities";
import { IChat } from "../interfaces";
import { logger } from "../services";

/**
 * Create a new chat
 */
export const createChat = async (
  users: mongoose.Types.ObjectId[],
  chatName: string
): Promise<IChat | undefined> => {
  try {
    const chatData: Partial<IChat> = {
      users,
      isGroupChat: true,
      chatName: chatName || "Group Chat",
    };
    return await Chat.create(chatData);
  } catch (error) {
    logger.error("Error creating chat", error);
    return undefined;
  }
};

/**
 * Get all chats for a specific user
 */
export const fetchUserMessages = async (userId: string) => {
  try {
    return await Chat.find({
      users: { $elemMatch: { $eq: userId } },
    })
      .populate("users", "-password")
      .populate("latestMessage")
      .sort({ updatedAt: -1 });
  } catch (error) {
    logger.error("Error fetching user messages", error);
    return undefined;
  }
};

/**
 * Get all messages for a specific chat
 */
export const getMessages = async (chatId: string) => {
  try {
    return await Message.find({ chat: chatId, isDeleted: false })
      .populate("sender", "-password")
      .sort({ createdAt: 1 });
  } catch (error) {
    logger.error("Error fetching messages", error);
    return undefined;
  }
};

/**
 * Add a user to a group chat
 */
export const addUserToGroup = async (chatId: string, userId: string) => {
  try {
    return await Chat.findByIdAndUpdate(
      chatId,
      { $addToSet: { users: userId } },
      { new: true }
    ).populate("users", "-password");
  } catch (error) {
    logger.error("Error adding user to group", error);
    throw error;
  }
};

/**
 * Remove a user from a group chat
 */
export const removeUserFromGroup = async (chatId: string, userId: string) => {
  try {
    return await Chat.findByIdAndUpdate(
      chatId,
      { $pull: { users: userId } },
      { new: true }
    ).populate("users", "-password");
  } catch (error) {
    logger.error("Error removing user from group", error);
    throw error;
  }
};

/**
 * Update group chat name
 */
export const updateGroupName = async (chatId: string, chatName: string) => {
  try {
    return await Chat.findByIdAndUpdate(
      chatId,
      { chatName },
      { new: true }
    ).populate("users", "-password");
  } catch (error) {
    logger.error("Error updating group name", error);
    throw error;
  }
};

/**
 * Get unread message count for a user
 */
export const getUnreadMessageCount = async (userId: string) => {
  try {
    const chats = await Chat.find({
      users: { $elemMatch: { $eq: userId } },
    });

    const counts: Record<string, number> = {};
    for (const chat of chats) {
      const unreadCount = await Message.countDocuments({
        chat: chat.id,
        readBy: { $ne: userId },
        sender: { $ne: userId },
      });
      counts[(chat as IChat).id.toString()] = unreadCount;
    }

    return counts;
  } catch (error) {
    logger.error("Error getting unread message count", error);
    throw error;
  }
};

/**
 * Archive a chat
 */
export const archiveChat = async (chatId: string) => {
  try {
    return await Chat.findByIdAndUpdate(
      chatId,
      { isDeleted: true, deletedAt: new Date() },
      { new: true }
    );
  } catch (error) {
    logger.error("Error archiving chat", error);
    throw error;
  }
};
