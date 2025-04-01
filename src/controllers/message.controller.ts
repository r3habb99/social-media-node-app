import { Response } from "express";
import { AuthRequest, logger, sendResponse } from "../services";
import { getMessages, saveMessage } from "../queries";
import { HttpResponseMessages, HttpStatusCodes } from "../constants";

/**
 * Create a new message
 */
export const createMessage = async (req: AuthRequest, res: Response) => {
  try {
    const { content, chatId } = req.body;

    if (!content || !chatId) {
      logger.error("Content and chatId are required");
      return sendResponse({
        res,
        statusCode: HttpStatusCodes.BAD_REQUEST,
        message: HttpResponseMessages.BAD_REQUEST,
        error: "Content and chatId are required",
      });
    }

    // Extract user ID from the token (auth middleware attaches user to req)
    const senderId = req.user?.id;

    const message = await saveMessage(senderId, content, chatId);
    logger.info("Message created successfully", message);
    sendResponse({
      res,
      statusCode: HttpStatusCodes.CREATED,
      message: HttpResponseMessages.CREATED,
      data: message,
    });
  } catch (error) {
    logger.error("Error creating message", error);
    sendResponse({
      res,
      statusCode: HttpStatusCodes.INTERNAL_SERVER_ERROR,
      message: HttpResponseMessages.INTERNAL_SERVER_ERROR,
      error: error,
    });
  }
};

/**
 * Get all messages
 */
export const getMessageID = async (req: AuthRequest, res: Response) => {
  try {
    const { chatId } = req.query;

    if (!chatId) {
      logger.error("chatId is required");
      return sendResponse({
        res,
        statusCode: HttpStatusCodes.BAD_REQUEST,
        message: HttpResponseMessages.BAD_REQUEST,
        error: "chatId is required",
      });
    }

    const messages = await getMessages(chatId as string);
    logger.info("Messages retrieved successfully", messages);
    sendResponse({
      res,
      statusCode: HttpStatusCodes.OK,
      message: HttpResponseMessages.SUCCESS,
      data: messages,
    });
  } catch (error) {
    logger.error("Error retrieving messages", error);
    sendResponse({
      res,
      statusCode: HttpStatusCodes.INTERNAL_SERVER_ERROR,
      message: HttpResponseMessages.INTERNAL_SERVER_ERROR,
      error: error,
    });
  }
};
