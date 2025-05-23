import mongoose from "mongoose";
import { Chat, Message } from "../entities";
import { IChat } from "../interfaces";
import { logger } from "../services";
import { transformChatMediaUrls, transformChatsMediaUrls } from "../utils/chatMediaUrl";
import { transformMessagesMediaUrls } from "../utils/messageMediaUrl";
import { getFullMediaUrl } from "../utils/mediaUrl";

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
    const newChat = await Chat.create(chatData);

    // Populate users to get their profile pictures
    await newChat.populate("users", "-password");

    // Transform profile picture URLs to full URLs
    const chatWithFullUrls = transformChatMediaUrls(newChat);
    return chatWithFullUrls || undefined;
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
    const chats = await Chat.find({
      users: { $elemMatch: { $eq: userId } },
    })
      .populate("users", "-password")
      .populate({
        path: "latestMessage",
        populate: {
          path: "sender",
          select: "-password"
        }
      })
      .sort({ updatedAt: -1 });

    // Transform profile picture URLs to full URLs
    const transformedChats = transformChatsMediaUrls(chats);

    // Double-check that all profile pictures have full URLs
    if (transformedChats && transformedChats.length > 0) {
      transformedChats.forEach(chat => {
        if (chat.users && Array.isArray(chat.users)) {
          chat.users.forEach((user: any) => {
            if (user && typeof user === 'object' && 'profilePic' in user) {
              if (user.profilePic && typeof user.profilePic === 'string' && !user.profilePic.startsWith('http')) {
                user.profilePic = getFullMediaUrl(user.profilePic);
              }
              if (user.coverPhoto && typeof user.coverPhoto === 'string' && !user.coverPhoto.startsWith('http')) {
                user.coverPhoto = getFullMediaUrl(user.coverPhoto);
              }
            }
          });
        }
      });
    }

    return transformedChats;
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
    const messages = await Message.find({ chat: chatId, isDeleted: false })
      .populate("sender", "-password")
      .sort({ createdAt: 1 });

    // Ensure all messages have valid IDs before transformation
    const validMessages = messages.filter(msg => msg && msg._id);

    // Transform profile picture URLs to full URLs
    return transformMessagesMediaUrls(validMessages);
  } catch (error) {
    logger.error("Error fetching messages", error);
    return [];  // Return empty array instead of undefined to avoid null checks
  }
};

/**
 * Add a user to a group chat
 */
export const addUserToGroup = async (chatId: string, userId: string) => {
  try {
    const updatedChat = await Chat.findByIdAndUpdate(
      chatId,
      { $addToSet: { users: userId } },
      { new: true }
    ).populate("users", "-password");

    // Transform profile picture URLs to full URLs
    return transformChatMediaUrls(updatedChat);
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
    const updatedChat = await Chat.findByIdAndUpdate(
      chatId,
      { $pull: { users: userId } },
      { new: true }
    ).populate("users", "-password");

    // Transform profile picture URLs to full URLs
    return transformChatMediaUrls(updatedChat);
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
    const updatedChat = await Chat.findByIdAndUpdate(
      chatId,
      { chatName },
      { new: true }
    ).populate("users", "-password");

    // Transform profile picture URLs to full URLs
    return transformChatMediaUrls(updatedChat);
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
    const archivedChat = await Chat.findByIdAndUpdate(
      chatId,
      { isDeleted: true, deletedAt: new Date() },
      { new: true }
    ).populate("users", "-password");

    // Transform profile picture URLs to full URLs
    return transformChatMediaUrls(archivedChat);
  } catch (error) {
    logger.error("Error archiving chat", error);
    throw error;
  }
};
