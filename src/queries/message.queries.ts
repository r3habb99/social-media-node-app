import mongoose from "mongoose";
import { Chat, Message } from "../entities";
import { IMessage } from "../interfaces";
import { logger } from "../services";

/**
 * Create a new message
 */
export const saveMessage = async (
  sender: mongoose.Types.ObjectId,
  content: string,
  chat: mongoose.Types.ObjectId
): Promise<IMessage> => {
  try {
    logger.info("Saving message to database...");
    logger.info(`Sender: ${sender}, Content: ${content}, Chat: ${chat}`);

    const newMessage: Partial<IMessage> = {
      sender,
      content,
      chat,
    };

    const message = await Message.create(newMessage);
    logger.info("Message created:", message);

    // Update the latest message in the chat
    await Chat.findByIdAndUpdate(chat, { latestMessage: message._id });
    logger.info("Updated latest message in chat:", chat);

    // Populate sender and chat before returning the message
    const populatedMessage = await Message.findById(message._id)
      .populate("sender", "-password")
      .populate("chat")
      .exec();

    if (!populatedMessage) {
      throw new Error("Message creation failed");
    }

    logger.info("Populated message:", populatedMessage);
    return populatedMessage as IMessage;
  } catch (error) {
    logger.error("Error saving message", error);
    throw error;
  }
};
