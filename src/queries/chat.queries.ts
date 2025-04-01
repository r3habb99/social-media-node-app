import mongoose from "mongoose";
import { Chat, Message } from "../entities";
import { IChat } from "../interfaces";
import { logger } from "../services";

/**
 * Create a new chat
 */
export const createMessage = async (
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
export const getMessages = async (chat: string) => {
  try {
    return await Message.find({ _id: chat })
      .populate("sender", "-password")
      .sort({ createdAt: 1 });
  } catch (error) {
    logger.error("Error fetching messages", error);
    return undefined;
  }
};
