import { NextFunction, Request, Response } from "express";
import { AuthRequest, logger, sendResponse } from "../services";
import { createMessage, fetchUserMessages, getMessages } from "../queries";
import { Chat, Message } from "../entities";
import mongoose from "mongoose";
import { HttpResponseMessages, HttpStatusCodes } from "../constants";

/**
 * Create a new individual chat
 */
export const createChat = async (req: AuthRequest, res: Response) => {
  try {
    const { userId } = req.body; // ID of the user to chat with
    const currentUserId = req.user?.id;

    if (!userId || !currentUserId) {
      return sendResponse({
        res,
        statusCode: HttpStatusCodes.BAD_REQUEST,
        message: "Both userId and currentUserId are required",
      });
    }

    // Check if a chat already exists between the two users
    let chat = await Chat.findOne({
      isGroupChat: false,
      users: { $all: [currentUserId, userId] },
    });

    if (!chat) {
      // Create a new chat if it doesn't exist
      chat = await Chat.create({
        chatName: "Individual Chat",
        isGroupChat: false,
        users: [currentUserId, userId],
      });
    }

    logger.info("Chat created successfully");
    return sendResponse({
      res,
      statusCode: HttpStatusCodes.CREATED,
      message: HttpResponseMessages.CREATED,
      data: chat,
    });
  } catch (error) {
    logger.error("Error creating chat", error);
    return sendResponse({
      res,
      statusCode: HttpStatusCodes.INTERNAL_SERVER_ERROR,
      message: HttpResponseMessages.INTERNAL_SERVER_ERROR,
      error,
    });
  }
};

/**
 * Create a new group chat
 */
export const createGroupChat = async (req: AuthRequest, res: Response) => {
  try {
    const { users, chatName } = req.body;
    const currentUserId = req.user?.id;

    if (!users || users.length < 2 || !chatName) {
      return sendResponse({
        res,
        statusCode: HttpStatusCodes.BAD_REQUEST,
        message: "A group chat requires at least 2 users and a chat name",
      });
    }

    // Add the current user to the group
    users.push(currentUserId);

    const chat = await Chat.create({
      chatName,
      isGroupChat: true,
      users,
    });

    logger.info("Group chat created successfully");
    return sendResponse({
      res,
      statusCode: HttpStatusCodes.CREATED,
      message: HttpResponseMessages.CREATED,
      data: chat,
    });
  } catch (error) {
    logger.error("Error creating group chat", error);
    return sendResponse({
      res,
      statusCode: HttpStatusCodes.INTERNAL_SERVER_ERROR,
      message: HttpResponseMessages.INTERNAL_SERVER_ERROR,
      error,
    });
  }
};

/**
 * Get messages for a specific chat
 */
export const getChatMessages = async (req: AuthRequest, res: Response) => {
  try {
    const { chatId } = req.params;

    const messages = await Message.find({ chat: chatId })
      .populate("sender", "-password")
      .sort({ createdAt: 1 });

    logger.info("Messages retrieved successfully");
    return sendResponse({
      res,
      statusCode: HttpStatusCodes.OK,
      message: HttpResponseMessages.SUCCESS,
      data: messages,
    });
  } catch (error) {
    logger.error("Error retrieving messages", error);
    return sendResponse({
      res,
      statusCode: HttpStatusCodes.INTERNAL_SERVER_ERROR,
      message: HttpResponseMessages.INTERNAL_SERVER_ERROR,
      error,
    });
  }
};

/**
 * Send a message in a chat
 */
export const sendMessage = async (req: AuthRequest, res: Response) => {
  try {
    const { chatId } = req.params;
    const { content } = req.body;
    const senderId = req.user?.id;

    if (!content || !chatId) {
      return sendResponse({
        res,
        statusCode: HttpStatusCodes.BAD_REQUEST,
        message: "Content and chatId are required",
      });
    }

    const message = await Message.create({
      sender: senderId,
      content,
      chat: chatId,
    });

    // Update the latest message in the chat
    await Chat.findByIdAndUpdate(chatId, { latestMessage: message._id });

    logger.info("Message sent successfully");
    return sendResponse({
      res,
      statusCode: HttpStatusCodes.CREATED,
      message: HttpResponseMessages.CREATED,
      data: message,
    });
  } catch (error) {
    logger.error("Error sending message", error);
    return sendResponse({
      res,
      statusCode: HttpStatusCodes.INTERNAL_SERVER_ERROR,
      message: HttpResponseMessages.INTERNAL_SERVER_ERROR,
      error,
    });
  }
};

/**
 * Get all chats for the logged-in user
 */
export const getUserChats = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user?.id;
    const chats = await fetchUserMessages(userId);
    logger.info("Fetched user chats", chats);
    if (!chats || chats.length === 0) {
      logger.warn("No chats found for user", userId);
      return sendResponse({
        res,
        statusCode: HttpStatusCodes.NO_CONTENT,
        message: HttpResponseMessages.NO_CONTENT,
        error: "No chats found for this user",
      });
    }
    logger.info("User chats fetched successfully", chats);
    sendResponse({
      res,
      statusCode: HttpStatusCodes.OK,
      message: HttpResponseMessages.SUCCESS,
      data: chats,
    });
  } catch (error) {
    logger.error("Error fetching user chats", error);
    sendResponse({
      res,
      statusCode: HttpStatusCodes.INTERNAL_SERVER_ERROR,
      message: HttpResponseMessages.INTERNAL_SERVER_ERROR,
      error: error,
    });
  }
};
