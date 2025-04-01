import { Request, Response, NextFunction } from "express";
import { AuthRequest, logger, sendResponse } from "../services";
import { createMessage, fetchUserMessages, getMessages } from "../queries";
import { HttpResponseMessages, HttpStatusCodes } from "../constants";
/**
 * Create a new chat
 */
export const createChat = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { users, chatName } = req.body;
    if (!users || users.length === 0) {
      logger.error("Users array is required");
      return sendResponse({
        res,
        statusCode: HttpStatusCodes.BAD_REQUEST,
        message: HttpResponseMessages.BAD_REQUEST,
        error: "Users array is required",
      });
    }

    // Extract user ID from the token (auth middleware should attach user object to req)
    const userId = req.user?.id;
    users.push(userId);

    const chat = await createMessage(users, chatName);
    logger.info("Chat created successfully", chat);
    sendResponse({
      res,
      statusCode: HttpStatusCodes.CREATED,
      message: HttpResponseMessages.CREATED,
      data: chat,
    });
  } catch (error) {
    logger.error("Error creating chat", error);
    sendResponse({
      res,
      statusCode: HttpStatusCodes.INTERNAL_SERVER_ERROR,
      message: HttpResponseMessages.INTERNAL_SERVER_ERROR,
      error: error,
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

/**
 * Get messages for a specific chat
 */
export const getChatMessages = async (req: Request, res: Response) => {
  try {
    const chatId = req.params.chatId;
    console.log(chatId, "chatId from getChatMessages");
    const messages = await getMessages(chatId);
    logger.info("Fetched messages for chat", chatId, messages);
    if (!messages || messages.length === 0) {
      logger.warn("No messages found for chat", chatId);
      return sendResponse({
        res,
        statusCode: HttpStatusCodes.NO_CONTENT,
        message: HttpResponseMessages.NO_CONTENT,
        error: "No messages found for this chat",
      });
    }
    logger.info("Messages fetched successfully", messages);
    sendResponse({
      res,
      statusCode: HttpStatusCodes.OK,
      message: HttpResponseMessages.SUCCESS,
      data: messages,
    });
  } catch (error) {
    logger.error("Error fetching chat messages", error);
    sendResponse({
      res,
      statusCode: HttpStatusCodes.INTERNAL_SERVER_ERROR,
      message: HttpResponseMessages.INTERNAL_SERVER_ERROR,
      error: error,
    });
  }
};
