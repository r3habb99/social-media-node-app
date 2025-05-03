import { Response } from "express";
import { AuthRequest, logger, sendResponse } from "../services";
import {
  getMessages,
  saveMessage,
  deleteMessageById,
  editMessageById,
  searchMessages,
} from "../queries";
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
 * Get all messages with pagination support
 */
export const getMessageID = async (req: AuthRequest, res: Response) => {
  try {
    const { chatId, limit = 20, skip = 0 } = req.query;

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

/**
 * Delete a message (soft delete)
 */
export const deleteMessage = async (req: AuthRequest, res: Response) => {
  try {
    const { messageId } = req.params;
    if (!messageId) {
      return sendResponse({
        res,
        statusCode: HttpStatusCodes.BAD_REQUEST,
        message: "messageId is required",
      });
    }
    await deleteMessageById(messageId);
    logger.info(`Message ${messageId} deleted (soft)`);
    sendResponse({
      res,
      statusCode: HttpStatusCodes.OK,
      message: "Message deleted successfully",
    });
  } catch (error) {
    logger.error("Error deleting message", error);
    sendResponse({
      res,
      statusCode: HttpStatusCodes.INTERNAL_SERVER_ERROR,
      message: HttpResponseMessages.INTERNAL_SERVER_ERROR,
      error,
    });
  }
};

/**
 * Edit a message
 */
export const editMessage = async (req: AuthRequest, res: Response) => {
  try {
    const { messageId } = req.params;
    const { content } = req.body;
    if (!messageId || !content) {
      return sendResponse({
        res,
        statusCode: HttpStatusCodes.BAD_REQUEST,
        message: "messageId and content are required",
      });
    }
    const updatedMessage = await editMessageById(messageId, content);
    logger.info(`Message ${messageId} edited`);
    sendResponse({
      res,
      statusCode: HttpStatusCodes.OK,
      message: "Message updated successfully",
      data: updatedMessage,
    });
  } catch (error) {
    logger.error("Error editing message", error);
    sendResponse({
      res,
      statusCode: HttpStatusCodes.INTERNAL_SERVER_ERROR,
      message: HttpResponseMessages.INTERNAL_SERVER_ERROR,
      error,
    });
  }
};

/**
 * Search messages by content or sender
 */
export const searchMessagesController = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const { chatId, query } = req.query;
    if (!chatId || !query) {
      return sendResponse({
        res,
        statusCode: HttpStatusCodes.BAD_REQUEST,
        message: "chatId and query are required",
      });
    }
    const results = await searchMessages(chatId as string, query as string);
    logger.info("Messages search completed");
    sendResponse({
      res,
      statusCode: HttpStatusCodes.OK,
      message: "Search results",
      data: results,
    });
  } catch (error) {
    logger.error("Error searching messages", error);
    sendResponse({
      res,
      statusCode: HttpStatusCodes.INTERNAL_SERVER_ERROR,
      message: HttpResponseMessages.INTERNAL_SERVER_ERROR,
      error,
    });
  }
};
