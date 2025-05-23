import { Response } from "express";
import mongoose from "mongoose";
import { AuthRequest, logger, sendResponse } from "../services";
import {
  getMessages,
  saveMessage,
  deleteMessageById,
  editMessageById,
  searchMessages,
  getMessageById,
} from "../queries";
import { HttpResponseMessages, HttpStatusCodes } from "../constants";
import {
  emitNewMessage,
  emitMessageDeleted,
  emitMessageEdited
} from "../services/chatSocketService";
import { MessageType } from "../interfaces";

/**
 * Create a new message
 */
export const createMessage = async (req: AuthRequest, res: Response) => {
  try {
    const { content, chatId, messageType, media, replyToId } = req.body;

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

    if (!senderId) {
      logger.error("User ID not found in token");
      return sendResponse({
        res,
        statusCode: HttpStatusCodes.UNAUTHORIZED,
        message: HttpResponseMessages.UNAUTHORIZED,
        error: "User ID not found in token",
      });
    }

    // Determine message type based on input or default to TEXT
    const msgType = messageType ||
      (media && media.length > 0 ?
        (media[0].includes('.mp4') || media[0].includes('.mov') ? MessageType.VIDEO :
         media[0].includes('.mp3') || media[0].includes('.wav') ? MessageType.AUDIO :
         MessageType.IMAGE) :
        MessageType.TEXT);

    // Save message with all provided data
    const message = await saveMessage(
      senderId,
      content,
      chatId,
      msgType,
      media || [],
      replyToId
    );

    // Emit socket event for real-time message delivery
    if (message) {
      emitNewMessage(chatId, message);
    }

    logger.info(`Message created successfully by user ${senderId} and broadcasted via socket`);
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
 * Handles both query parameters and route parameters for chatId
 */
export const getMessageID = async (req: AuthRequest, res: Response) => {
  try {
    // Get chatId from either query params or route params
    let chatIdParam = req.query.chatId || req.params.chatId;
    const { limit = 20, skip = 0 } = req.query;

    if (!chatIdParam) {
      logger.error("chatId is required");
      return sendResponse({
        res,
        statusCode: HttpStatusCodes.BAD_REQUEST,
        message: HttpResponseMessages.BAD_REQUEST,
        error: "chatId is required",
      });
    }

    // Ensure chatId is a string
    const chatId = chatIdParam as string;

    // Validate that the chatId is a valid ObjectId if it's not 'id'
    if (chatId === 'id') {
      return sendResponse({
        res,
        statusCode: HttpStatusCodes.BAD_REQUEST,
        message: "Invalid chat ID",
        error: "Chat ID cannot be 'id'",
      });
    }

    try {
      const messages = await getMessages(
        chatId,
        parseInt(limit as string, 10),
        parseInt(skip as string, 10)
      );

      sendResponse({
        res,
        statusCode: HttpStatusCodes.OK,
        message: HttpResponseMessages.SUCCESS,
        data: messages,
      });
    } catch (err) {
      logger.error(`Error retrieving messages for chat ${chatId}`, err);
      sendResponse({
        res,
        statusCode: HttpStatusCodes.INTERNAL_SERVER_ERROR,
        message: HttpResponseMessages.INTERNAL_SERVER_ERROR,
        error: err,
      });
    }
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
    const { chatId } = req.body; // Require chatId for socket event

    if (!messageId) {
      return sendResponse({
        res,
        statusCode: HttpStatusCodes.BAD_REQUEST,
        message: "messageId is required",
      });
    }

    if (!chatId) {
      return sendResponse({
        res,
        statusCode: HttpStatusCodes.BAD_REQUEST,
        message: "chatId is required in request body",
      });
    }

    const deletedMessage = await deleteMessageById(messageId);

    // Emit socket event for real-time update
    emitMessageDeleted(chatId, messageId);

    logger.info(`Message ${messageId} deleted (soft) and broadcasted via socket`);
    sendResponse({
      res,
      statusCode: HttpStatusCodes.OK,
      message: "Message deleted successfully",
      data: deletedMessage
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
    const { content, chatId, media } = req.body;

    if (!messageId) {
      return sendResponse({
        res,
        statusCode: HttpStatusCodes.BAD_REQUEST,
        message: "messageId is required",
      });
    }

    if (!content && !media) {
      return sendResponse({
        res,
        statusCode: HttpStatusCodes.BAD_REQUEST,
        message: "Either content or media must be provided",
      });
    }

    if (!chatId) {
      return sendResponse({
        res,
        statusCode: HttpStatusCodes.BAD_REQUEST,
        message: "chatId is required in request body",
      });
    }

    const updatedMessage = await editMessageById(messageId, content, media);

    // Emit socket event for real-time update
    if (updatedMessage) {
      emitMessageEdited(chatId, updatedMessage);
    }

    logger.info(`Message ${messageId} edited and broadcasted via socket`);
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

/**
 * Get a message by ID or all messages for a chat
 * This dual-purpose controller handles both:
 * 1. Getting a single message by its ID
 * 2. Getting all messages for a chat when the messageId is actually a chatId
 */
export const getSingleMessage = async (req: AuthRequest, res: Response) => {
  try {
    const { messageId } = req.params;
    const { chatId, limit = 20, skip = 0 } = req.query;

    if (!messageId) {
      return sendResponse({
        res,
        statusCode: HttpStatusCodes.BAD_REQUEST,
        message: "ID parameter is required",
      });
    }

    // Special case: If messageId is 'id' and chatId is provided in query params
    if (messageId === 'id' && chatId) {
      try {
        // Use the chatId from query params
        const messages = await getMessages(
          chatId as string,
          parseInt(limit as string, 10),
          parseInt(skip as string, 10)
        );

        return sendResponse({
          res,
          statusCode: HttpStatusCodes.OK,
          message: HttpResponseMessages.SUCCESS,
          data: messages,
        });
      } catch (chatErr) {
        logger.error(`Error retrieving messages for chat ${chatId}`, chatErr);
        return sendResponse({
          res,
          statusCode: HttpStatusCodes.INTERNAL_SERVER_ERROR,
          message: HttpResponseMessages.INTERNAL_SERVER_ERROR,
          error: chatErr,
        });
      }
    }

    // For all other cases, try to determine if this is a valid ObjectId
    let isValidObjectId = false;
    try {
      // Check if the ID is a valid MongoDB ObjectId
      new mongoose.Types.ObjectId(messageId);
      isValidObjectId = true;
    } catch (err) {
      // Not a valid ObjectId
      isValidObjectId = false;
    }

    if (isValidObjectId) {
      // It's a valid ObjectId, so try to get a single message
      try {
        // Use the query function to get the message
        const message = await getMessageById(messageId);

        sendResponse({
          res,
          statusCode: HttpStatusCodes.OK,
          message: HttpResponseMessages.SUCCESS,
          data: message,
        });
      } catch (err: any) {
        // Handle the case where message is not found
        if (err.message === "Message not found") {
          return sendResponse({
            res,
            statusCode: HttpStatusCodes.NOT_FOUND,
            message: "Message not found",
          });
        }
        throw err; // Re-throw other errors to be caught by the outer catch block
      }
    } else {
      // Not a valid ObjectId and not the special 'id' case
      // This is likely an error case
      return sendResponse({
        res,
        statusCode: HttpStatusCodes.BAD_REQUEST,
        message: "Invalid message ID format",
      });
    }
  } catch (error) {
    logger.error("Error retrieving message", error);
    sendResponse({
      res,
      statusCode: HttpStatusCodes.INTERNAL_SERVER_ERROR,
      message: HttpResponseMessages.INTERNAL_SERVER_ERROR,
      error,
    });
  }
};
