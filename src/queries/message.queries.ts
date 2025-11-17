import mongoose from "mongoose";
import { Message } from "../entities";
import { logger, encryptMessage, decryptMessage } from "../services";
import { transformMessagesMediaUrls, transformMessageMediaUrls } from "../utils/messageMediaUrl";
import { MessageType, MessageStatus } from "../interfaces";

/**
 * Save a new message
 */
export const saveMessage = async (
  senderId: string,
  content: string,
  chatId: string,
  messageType: MessageType = MessageType.TEXT,
  media: string[] = [],
  replyToId?: string
) => {
  try {
    // Encrypt the message content before saving
    const encryptedData = encryptMessage(content);

    // Create message object with all fields
    const messageData: any = {
      sender: senderId,
      content: encryptedData.encryptedContent, // Store encrypted content
      iv: encryptedData.iv, // Store IV for decryption
      authTag: encryptedData.authTag, // Store auth tag for decryption
      chat: chatId,
      messageType,
      status: MessageStatus.SENT,
    };

    // Add optional fields if provided
    if (media && media.length > 0) {
      messageData.media = media;
    }

    if (replyToId) {
      messageData.replyTo = replyToId;
    }

    const message = await Message.create(messageData);

    // Populate the sender, chat, and replyTo if exists
    await message.populate([
      { path: "sender", select: "-password" },
      { path: "chat" },
      { path: "replyTo", populate: { path: "sender", select: "-password" } }
    ]);

    // Decrypt the message content before returning to client
    const decryptedContent = decryptMessage({
      encryptedContent: message.content,
      iv: message.iv!,
      authTag: message.authTag!
    });

    // Transform all media URLs to full URLs and return with decrypted content
    const transformedMessage = transformMessageMediaUrls(message);
    return {
      ...transformedMessage,
      content: decryptedContent // Return human-readable content
    };
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

    // Check if user ID is already in readBy array
    const readByIds = message.readBy.map(id =>
      id instanceof mongoose.Types.ObjectId ? id.toString() : id.toString()
    );

    if (!readByIds.includes(userObjectId.toString())) {
      message.readBy.push(userObjectId as any);
      message.status = MessageStatus.READ;
      await message.save();
    }

    // Populate the message with user details
    await message.populate([
      { path: "sender", select: "-password" },
      { path: "chat" },
      { path: "readBy", select: "-password" },
      { path: "replyTo", populate: { path: "sender", select: "-password" } }
    ]);

    const transformedMessage = transformMessageMediaUrls(message);

    // Decrypt the message content before returning
    if (transformedMessage && transformedMessage.iv && transformedMessage.authTag) {
      try {
        const decryptedContent = decryptMessage({
          encryptedContent: transformedMessage.content,
          iv: transformedMessage.iv,
          authTag: transformedMessage.authTag
        });
        return {
          ...transformedMessage,
          content: decryptedContent // Return human-readable content
        };
      } catch (error) {
        logger.error(`Error decrypting message ${messageId}:`, error);
        return transformedMessage;
      }
    }

    return transformedMessage;
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

    // Return the updated message with populated fields
    await message.populate([
      { path: "sender", select: "-password" },
      { path: "chat" }
    ]);

    const transformedMessage = transformMessageMediaUrls(message);

    // Decrypt the message content before returning
    if (transformedMessage && transformedMessage.iv && transformedMessage.authTag) {
      try {
        const decryptedContent = decryptMessage({
          encryptedContent: transformedMessage.content,
          iv: transformedMessage.iv,
          authTag: transformedMessage.authTag
        });
        return {
          ...transformedMessage,
          content: decryptedContent // Return human-readable content
        };
      } catch (error) {
        logger.error(`Error decrypting deleted message ${messageId}:`, error);
        return transformedMessage;
      }
    }

    return transformedMessage;
  } catch (error) {
    logger.error("Error deleting message", error);
    throw error;
  }
};

/**
 * Edit a message content
 */
export const editMessageById = async (
  messageId: string,
  content: string,
  media?: string[]
) => {
  try {
    const message = await Message.findById(new mongoose.Types.ObjectId(messageId));
    if (!message) {
      throw new Error("Message not found");
    }

    // Update content if provided - encrypt it first
    if (content) {
      const encryptedData = encryptMessage(content);
      message.content = encryptedData.encryptedContent;
      message.iv = encryptedData.iv;
      message.authTag = encryptedData.authTag;
    }

    // Update media if provided
    if (media !== undefined) {
      message.media = media;
    }

    message.updatedAt = new Date();
    await message.save();

    // Populate the message with user details
    await message.populate([
      { path: "sender", select: "-password" },
      { path: "chat" },
      { path: "readBy", select: "-password" },
      { path: "replyTo", populate: { path: "sender", select: "-password" } }
    ]);

    const transformedMessage = transformMessageMediaUrls(message);

    // Decrypt the message content before returning
    if (transformedMessage && transformedMessage.iv && transformedMessage.authTag) {
      try {
        const decryptedContent = decryptMessage({
          encryptedContent: transformedMessage.content,
          iv: transformedMessage.iv,
          authTag: transformedMessage.authTag
        });
        return {
          ...transformedMessage,
          content: decryptedContent // Return human-readable content
        };
      } catch (error) {
        logger.error(`Error decrypting edited message ${messageId}:`, error);
        return transformedMessage;
      }
    }

    return transformedMessage;
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
    // Convert chatId to ObjectId if it's not already
    let chatObjectId;
    try {
      chatObjectId = new mongoose.Types.ObjectId(chatId);
    } catch (err) {
      throw new Error(`Invalid chat ID format: ${chatId}`);
    }

    const messages = await Message.find({ chat: chatObjectId, isDeleted: false })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate([
        { path: "sender", select: "-password" },
        { path: "chat", populate: { path: "users", select: "-password" } },
        { path: "readBy", select: "-password" },
        { path: "replyTo", populate: { path: "sender", select: "-password" } }
      ]);

    // Transform all media URLs to full URLs
    const transformedMessages = transformMessagesMediaUrls(messages);

    // Decrypt all messages before returning
    const decryptedMessages = transformedMessages.map((msg: any) => {
      // Check if message has encryption metadata
      if (msg.iv && msg.authTag) {
        try {
          const decryptedContent = decryptMessage({
            encryptedContent: msg.content,
            iv: msg.iv,
            authTag: msg.authTag
          });
          return {
            ...msg,
            content: decryptedContent // Return human-readable content
          };
        } catch (error) {
          logger.error(`Error decrypting message ${msg.id}:`, error);
          // Return original message if decryption fails (backward compatibility)
          return msg;
        }
      }
      // Return as-is if no encryption metadata (backward compatibility)
      return msg;
    });

    return decryptedMessages;
  } catch (error) {
    logger.error(`Error fetching messages for chat ${chatId}`, error);
    throw error;
  }
};

/**
 * Search messages by content or sender with pagination and sorting
 * NOTE: For encrypted messages, we fetch all messages, decrypt them, and then filter
 * This is less efficient but necessary for encrypted content
 */
export const searchMessages = async (
  chatId: string,
  query: string,
  limit: number = 20,
  skip: number = 0,
  sortBy: string = "createdAt",
  sortOrder: string = "desc"
) => {
  try {
    // Validate ObjectId format before querying
    if (!mongoose.Types.ObjectId.isValid(chatId)) {
      throw new Error("Invalid chat ID format - must be a valid MongoDB ObjectId");
    }

    // Fetch ALL messages from the chat (we need to decrypt them to search)
    const allMessages = await Message.find({
      chat: new mongoose.Types.ObjectId(chatId),
      isDeleted: false,
    })
    .populate([
      { path: "sender", select: "-password" },
      { path: "chat" },
      { path: "readBy", select: "-password" },
      { path: "replyTo", populate: { path: "sender", select: "-password" } }
    ]);

    // Transform all media URLs to full URLs
    const transformedMessages = transformMessagesMediaUrls(allMessages);

    // Decrypt all messages
    const decryptedMessages = transformedMessages.map((msg: any) => {
      // Check if message has encryption metadata
      if (msg.iv && msg.authTag) {
        try {
          const decryptedContent = decryptMessage({
            encryptedContent: msg.content,
            iv: msg.iv,
            authTag: msg.authTag
          });
          return {
            ...msg,
            content: decryptedContent // Decrypted human-readable content
          };
        } catch (error) {
          logger.error(`Error decrypting message ${msg.id}:`, error);
          return msg;
        }
      }
      return msg;
    });

    // Now search in the decrypted content
    const regex = new RegExp(query, "i");
    const filteredMessages = decryptedMessages.filter((msg: any) => {
      return regex.test(msg.content);
      // You can add more search fields here if needed
      // || regex.test(msg.sender?.username)
    });

    // Sort the filtered messages
    const sortOptions: any = {};
    sortOptions[sortBy] = sortOrder === "asc" ? 1 : -1;

    filteredMessages.sort((a: any, b: any) => {
      const aValue = a[sortBy];
      const bValue = b[sortBy];

      if (sortOrder === "asc") {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    // Apply pagination
    const paginatedMessages = filteredMessages.slice(skip, skip + limit);

    return paginatedMessages;
  } catch (error) {
    logger.error("Error searching messages", error);
    throw error;
  }
};

/**
 * Get message by ID with full population
 */
export const getMessageById = async (messageId: string) => {
  try {
    const message = await Message.findById(new mongoose.Types.ObjectId(messageId))
      .populate([
        { path: "sender", select: "-password" },
        { path: "chat", populate: { path: "users", select: "-password" } },
        { path: "readBy", select: "-password" },
        { path: "replyTo", populate: { path: "sender", select: "-password" } }
      ]);

    if (!message) {
      throw new Error("Message not found");
    }

    // Transform all media URLs to full URLs
    const transformedMessage = transformMessageMediaUrls(message);

    // Decrypt the message content if encrypted
    if (transformedMessage && transformedMessage.iv && transformedMessage.authTag) {
      try {
        const decryptedContent = decryptMessage({
          encryptedContent: transformedMessage.content,
          iv: transformedMessage.iv,
          authTag: transformedMessage.authTag
        });
        return {
          ...transformedMessage,
          content: decryptedContent // Return human-readable content
        };
      } catch (error) {
        logger.error(`Error decrypting message ${messageId}:`, error);
        return transformedMessage;
      }
    }

    return transformedMessage;
  } catch (error) {
    logger.error(`Error fetching message with ID ${messageId}`, error);
    throw error;
  }
};
