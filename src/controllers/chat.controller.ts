import { Response } from "express";
import { AuthRequest, logger, sendResponse } from "../services";
import {
  fetchUserMessages,
  getChatMessages as getChatMessagesQuery,
  addUserToGroup,
  removeUserFromGroup,
  updateGroupName,
  getUnreadMessageCount,
  archiveChat,
  saveMessage,
  getUserByIdFromProfilePic,
} from "../queries";
import { Chat } from "../entities";
import { HttpResponseMessages, HttpStatusCodes } from "../constants";
import { IUser } from "../interfaces/user.interface";
import { getFullMediaUrl } from "../utils/mediaUrl";
import {
  emitNewMessage,
  emitChatUpdated,
  emitUserAddedToGroup,
  emitUserRemovedFromGroup,
  emitGroupNameUpdated
} from "../services/chatSocketService";

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

    // Get the user details to use their username as the chat name
    const chatPartner = await getUserByIdFromProfilePic(userId);
    if (!chatPartner) {
      return sendResponse({
        res,
        statusCode: HttpStatusCodes.NOT_FOUND,
        message: "User not found",
      });
    }

    // Generate a chat name using the user's username or full name
    const username = chatPartner.username || "";
    const firstName = chatPartner.firstName || "";
    const lastName = chatPartner.lastName || "";
    const chatName = username || `${firstName} ${lastName}`.trim() || "Chat";

    // Check if a chat already exists between the two users
    let chat = await Chat.findOne({
      isGroupChat: false,
      users: { $all: [currentUserId, userId] },
    }).populate("users", "-password");

    let isNewChat = false;
    if (!chat) {
      isNewChat = true;
      // Create a new chat if it doesn't exist
      chat = await Chat.create({
        chatName,
        isGroupChat: false,
        users: [currentUserId, userId],
      });

      // Populate the users field after creation
      chat = await chat.populate("users", "-password");
    }

    // If this is a new chat, emit socket event for real-time update
    if (isNewChat && chat) {
      // Emit to both users
      const chatId = chat._id ? chat._id.toString() : chat.id?.toString();
      if (chatId) {
        emitChatUpdated(chatId, chat);
        logger.info(`New chat created and broadcasted via socket`);
      }
    }

    logger.info(`Chat created successfully with ${chatName}`);
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

    // Validation is handled by middleware, but add extra safety checks
    if (!users || !Array.isArray(users) || users.length < 1 || !chatName) {
      return sendResponse({
        res,
        statusCode: HttpStatusCodes.BAD_REQUEST,
        message: "A group chat requires at least 1 other user and a chat name",
      });
    }

    // Check if creator is trying to add themselves
    if (users.includes(currentUserId)) {
      return sendResponse({
        res,
        statusCode: HttpStatusCodes.BAD_REQUEST,
        message: "You cannot add yourself to the group - you are automatically included as the creator",
      });
    }

    // Check for duplicates in the users array
    const userSet = new Set(users);
    if (userSet.size !== users.length) {
      return sendResponse({
        res,
        statusCode: HttpStatusCodes.BAD_REQUEST,
        message: "Duplicate users are not allowed in the group",
      });
    }

    // Add the current user as the creator
    const allUsers = [currentUserId, ...users];

    // Final check for total user count
    if (allUsers.length > 50) {
      return sendResponse({
        res,
        statusCode: HttpStatusCodes.BAD_REQUEST,
        message: "A group chat cannot have more than 50 users total",
      });
    }

    // Verify all users exist (optional - you might want to add this check)
    // const existingUsers = await User.find({ _id: { $in: uniqueUsers } });
    // if (existingUsers.length !== uniqueUsers.length) {
    //   return sendResponse({
    //     res,
    //     statusCode: HttpStatusCodes.BAD_REQUEST,
    //     message: "One or more users do not exist",
    //   });
    // }

    const chat = await Chat.create({
      chatName: chatName.trim(),
      isGroupChat: true,
      users: allUsers,
    });

    // Populate the chat with user details
    await chat.populate("users", "-password");

    logger.info(`Group chat "${chatName}" created successfully with ${allUsers.length} users (creator: ${currentUserId})`);
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

    const messages = await getChatMessagesQuery(chatId);

    if (!messages) {
      return sendResponse({
        res,
        statusCode: HttpStatusCodes.NOT_FOUND,
        message: "No messages found for this chat",
      });
    }

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

    // Use the saveMessage function from message.queries.ts
    const message = await saveMessage(senderId, content, chatId);

    // Update the latest message in the chat
    if (message && message._id) {
      await Chat.findByIdAndUpdate(chatId, { latestMessage: message._id });

      // Emit socket event for real-time message delivery
      emitNewMessage(chatId, message);
    }

    logger.info("Message sent successfully and broadcasted via socket");
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
export const getUserChats = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    let chats = await fetchUserMessages(userId);

    if (!chats || chats.length === 0) {
      logger.warn("No chats found for user", userId);
      return sendResponse({
        res,
        statusCode: HttpStatusCodes.NO_CONTENT,
        message: HttpResponseMessages.NO_CONTENT,
        error: "No chats found for this user",
      });
    }

    // Process chats to ensure proper chat names for individual chats
    const processedChats = chats.map((chat) => {
      // If it's not a group chat, set the chat name to the other user's name
      if (!chat.isGroupChat && chat.users && chat.users.length > 0) {
        // Find the other user in the chat (not the current user)
        const otherUser = chat.users.find(
          (user) =>
            user &&
            typeof user !== "string" &&
            user.id &&
            user.id.toString() !== userId
        ) as IUser;

        if (otherUser && typeof otherUser !== "string") {
          // Use username or full name as chat name
          const username = otherUser.username || "";
          const firstName = otherUser.firstName || "";
          const lastName = otherUser.lastName || "";

          chat.chatName =
            username || `${firstName} ${lastName}`.trim() || "Chat";
        }
      }

      // Manually ensure all profile pictures have full URLs
      if (chat.users && Array.isArray(chat.users)) {
        chat.users = chat.users.map((user: any) => {
          if (user && typeof user === 'object' && 'profilePic' in user &&
              typeof user.profilePic === 'string' && !user.profilePic.startsWith('http')) {
            user.profilePic = getFullMediaUrl(user.profilePic);
          }
          if (user && typeof user === 'object' && 'coverPhoto' in user &&
              typeof user.coverPhoto === 'string' && !user.coverPhoto.startsWith('http')) {
            user.coverPhoto = getFullMediaUrl(user.coverPhoto);
          }
          return user;
        }) as any;
      }

      // Also ensure the latest message sender's profile picture has a full URL
      if (chat.latestMessage && typeof chat.latestMessage === 'object' &&
          'sender' in chat.latestMessage && chat.latestMessage.sender &&
          typeof chat.latestMessage.sender === 'object' &&
          'profilePic' in chat.latestMessage.sender &&
          typeof chat.latestMessage.sender.profilePic === 'string' &&
          !chat.latestMessage.sender.profilePic.startsWith('http')) {
        (chat.latestMessage.sender as any).profilePic = getFullMediaUrl(chat.latestMessage.sender.profilePic);
      }

      return chat;
    });

    logger.info("User chats fetched and processed successfully");
    sendResponse({
      res,
      statusCode: HttpStatusCodes.OK,
      message: HttpResponseMessages.SUCCESS,
      data: processedChats,
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
 * Add a user to a group chat
 */
export const addUserToGroupChat = async (req: AuthRequest, res: Response) => {
  try {
    const { chatId, userId } = req.body;
    if (!chatId || !userId) {
      return sendResponse({
        res,
        statusCode: HttpStatusCodes.BAD_REQUEST,
        message: "chatId and userId are required",
      });
    }
    const chat = await addUserToGroup(chatId, userId);

    // Emit socket event for real-time update
    emitUserAddedToGroup(chatId, userId, chat);

    logger.info(`User ${userId} added to group chat ${chatId} and broadcasted via socket`);
    sendResponse({
      res,
      statusCode: HttpStatusCodes.OK,
      message: "User added to group chat",
      data: chat,
    });
  } catch (error) {
    logger.error("Error adding user to group chat", error);
    sendResponse({
      res,
      statusCode: HttpStatusCodes.INTERNAL_SERVER_ERROR,
      message: HttpResponseMessages.INTERNAL_SERVER_ERROR,
      error,
    });
  }
};

/**
 * Remove a user from a group chat
 */
export const removeUserFromGroupChat = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const { chatId, userId } = req.body;
    if (!chatId || !userId) {
      return sendResponse({
        res,
        statusCode: HttpStatusCodes.BAD_REQUEST,
        message: "chatId and userId are required",
      });
    }
    const chat = await removeUserFromGroup(chatId, userId);

    // Emit socket event for real-time update
    emitUserRemovedFromGroup(chatId, userId, chat);

    logger.info(`User ${userId} removed from group chat ${chatId} and broadcasted via socket`);
    sendResponse({
      res,
      statusCode: HttpStatusCodes.OK,
      message: "User removed from group chat",
      data: chat,
    });
  } catch (error) {
    logger.error("Error removing user from group chat", error);
    sendResponse({
      res,
      statusCode: HttpStatusCodes.INTERNAL_SERVER_ERROR,
      message: HttpResponseMessages.INTERNAL_SERVER_ERROR,
      error,
    });
  }
};

/**
 * Update group chat name
 */
export const updateGroupChatName = async (req: AuthRequest, res: Response) => {
  try {
    const { chatId, chatName } = req.body;
    if (!chatId || !chatName) {
      return sendResponse({
        res,
        statusCode: HttpStatusCodes.BAD_REQUEST,
        message: "chatId and chatName are required",
      });
    }
    const chat = await updateGroupName(chatId, chatName);

    // Emit socket event for real-time update
    emitGroupNameUpdated(chatId, chatName, chat);

    logger.info(`Group chat ${chatId} name updated to ${chatName} and broadcasted via socket`);
    sendResponse({
      res,
      statusCode: HttpStatusCodes.OK,
      message: "Group chat name updated",
      data: chat,
    });
  } catch (error) {
    logger.error("Error updating group chat name", error);
    sendResponse({
      res,
      statusCode: HttpStatusCodes.INTERNAL_SERVER_ERROR,
      message: HttpResponseMessages.INTERNAL_SERVER_ERROR,
      error,
    });
  }
};

/**
 * Get unread message count for user
 */
export const getUnreadMessagesCount = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const userId = req.user?.id;
    const counts = await getUnreadMessageCount(userId);
    logger.info("Unread message counts fetched");
    sendResponse({
      res,
      statusCode: HttpStatusCodes.OK,
      message: "Unread message counts",
      data: counts,
    });
  } catch (error) {
    logger.error("Error fetching unread message counts", error);
    sendResponse({
      res,
      statusCode: HttpStatusCodes.INTERNAL_SERVER_ERROR,
      message: HttpResponseMessages.INTERNAL_SERVER_ERROR,
      error,
    });
  }
};

/**
 * Archive a chat
 */
export const archiveChatController = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const { chatId } = req.body;
    if (!chatId) {
      return sendResponse({
        res,
        statusCode: HttpStatusCodes.BAD_REQUEST,
        message: "chatId is required",
      });
    }
    const chat = await archiveChat(chatId);
    logger.info(`Chat ${chatId} archived`);
    sendResponse({
      res,
      statusCode: HttpStatusCodes.OK,
      message: "Chat archived successfully",
      data: chat,
    });
  } catch (error) {
    logger.error("Error archiving chat", error);
    sendResponse({
      res,
      statusCode: HttpStatusCodes.INTERNAL_SERVER_ERROR,
      message: HttpResponseMessages.INTERNAL_SERVER_ERROR,
      error,
    });
  }
};
