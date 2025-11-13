import { Server, Socket } from "socket.io";
import { logger } from "../../services";
import { saveMessage, markMessageAsRead, getMessages } from "../../queries";
import { Chat } from "../../entities";
import {
  addUserToRoom,
  removeUserFromRoom,
  getActiveUser,
  ensureFullMediaUrls,
  isUserOnline,
  getUserSocketIds,
  cleanupUserData,
  getAllOnlineUsers
} from "../utils/socketUtils";

// Interface for tracking pending messages
interface PendingMessage {
  id: string;
  content: string;
  chatId: string;
  timestamp: Date;
  retries: number;
}

// Map to store pending messages (socketId -> PendingMessage[])
const pendingMessages = new Map<string, PendingMessage[]>();

// Map to track last typing event time per room
const lastTypingEvents = new Map<string, number>();

// Throttle interval for typing events (milliseconds)
const TYPING_THROTTLE_MS = 3000; // 3 seconds

/**
 * Register chat event handlers
 */
export const registerChatHandlers = (io: Server, socket: Socket) => {
  const userId = socket.data.userId;

  // Join a chat room
  socket.on("join room", (roomId, callback) => {
    try {
      if (!roomId) {
        throw new Error("Invalid room ID");
      }

      socket.join(roomId);
      addUserToRoom(socket.id, roomId);

      // Get room info for debugging
      const roomSockets = io.sockets.adapter.rooms.get(roomId);
      const roomSize = roomSockets ? roomSockets.size : 0;

      const user = getActiveUser(socket.id);
      if (user) {
        // Notify room that user has joined
        socket.to(roomId).emit("user joined", {
          userId: user.userId,
          username: user.username,
        });
      }

      logger.info(`User ${userId} joined room: ${roomId} (${roomSize} total users in room)`);

      // Send acknowledgment if callback provided
      if (typeof callback === 'function') {
        callback({ success: true });
      }
    } catch (error) {
      const errorMessage = (error as Error)?.message || "Unknown error joining room";
      logger.error(`Error joining room: ${errorMessage}`);
      socket.emit("error", { message: errorMessage });

      // Send error in acknowledgment if callback provided
      if (typeof callback === 'function') {
        callback({ success: false, error: errorMessage });
      }
    }
  });

  // Leave a chat room
  socket.on("leave room", (roomId) => {
    try {
      if (!roomId) {
        throw new Error("Invalid room ID");
      }

      socket.leave(roomId);
      removeUserFromRoom(socket.id, roomId);

      // Get room info for debugging
      const roomSockets = io.sockets.adapter.rooms.get(roomId);
      const roomSize = roomSockets ? roomSockets.size : 0;

      const user = getActiveUser(socket.id);
      if (user) {
        // Notify room that user has left
        socket.to(roomId).emit("user left", {
          userId: user.userId,
          username: user.username,
        });
      }

      logger.info(`User ${userId} left room: ${roomId} (${roomSize} users remaining)`);
    } catch (error: any) {
      const errorMessage = error?.message || "Unknown error leaving room";
      logger.error(`Error leaving room: ${errorMessage}`);
      socket.emit("error", { message: errorMessage });
    }
  });

  // Handle sending a new message with delivery acknowledgment
  socket.on("new message", async (message, callback) => {
    try {
      logger.info("New message arrived");
      const chatRoomId = message.chat?._id || message.chat?.id || message.chat;
      if (!chatRoomId) {
        throw new Error("Invalid chat room ID");
      }

      if (!message.content || message.content.trim() === "") {
        throw new Error("Message content cannot be empty");
      }

      // Save message to DB with initial status "sent"
      const savedMessage = await saveMessage(
        userId,
        message.content,
        chatRoomId
      );

      // Update chat's latest message if message was saved successfully
      // Note: savedMessage has 'id' property (not '_id') due to toJSON transform
      if (savedMessage && (savedMessage._id || savedMessage.id)) {
        await Chat.findByIdAndUpdate(chatRoomId, {
          latestMessage: savedMessage._id || savedMessage.id,
        });

        // Transform message to ensure all media URLs are full URLs
        const transformedMessage = ensureFullMediaUrls({
          ...savedMessage,
          status: "delivered"
        });


        // Get room info for debugging
        const roomSockets = io.sockets.adapter.rooms.get(chatRoomId);
        const roomSize = roomSockets ? roomSockets.size : 0;
 
        if (roomSockets) {
          const socketIds = Array.from(roomSockets);
       } else {
          logger.error(`ERROR: Room ${chatRoomId} not found in adapter!`);
        }

        logger.info(`📡 Broadcasting message to room ${chatRoomId} with ${roomSize} connected sockets`);

        // Broadcast message to room
        io.to(chatRoomId).emit("message received", transformedMessage);


        // Confirm delivery to sender
        socket.emit("message delivered", {
          messageId: savedMessage._id || savedMessage.id,
          timestamp: new Date(),
          status: "delivered"
        });

        // Send acknowledgment if callback provided
        if (typeof callback === 'function') {
          callback({
            success: true,
            messageId: savedMessage._id || savedMessage.id,
            status: "delivered",
            timestamp: new Date()
          });
        }
      }

      logger.info(
        `📨 Message from ${userId} saved and broadcasted to room: ${chatRoomId}`
      );
    } catch (error: any) {
      const errorMessage = error?.message || "Unknown error sending message";
      logger.error(`Error sending message: ${errorMessage}`, error);

      // Send error to sender
      socket.emit("error", {
        message: `Failed to send message: ${errorMessage}`,
        context: "message_send_failed"
      });

      // Send error in acknowledgment if callback provided
      if (typeof callback === 'function') {
        callback({
          success: false,
          error: errorMessage,
          context: "message_send_failed"
        });
      }
    }
  });

  // Enhanced typing indicators with throttling
  socket.on("typing", (data, callback) => {
    try {
      // Support both roomId and chatId in payload
      const roomId = data.roomId || data.chatId;
      const isTyping = data.isTyping !== undefined ? data.isTyping : true;

      if (!roomId) {
        throw new Error("Invalid room ID for typing event");
      }

      const user = getActiveUser(socket.id);
      if (!user) {
        throw new Error("User not found");
      }

      // Create a unique key for this user and room
      const typingKey = `${user.userId}:${roomId}`;
      const now = Date.now();

      // Check if we should throttle this event
      const lastTypingTime = lastTypingEvents.get(typingKey) || 0;
      const shouldThrottle = isTyping && (now - lastTypingTime < TYPING_THROTTLE_MS);

      // Only broadcast if not throttled or if "stopped typing"
      if (!shouldThrottle || !isTyping) {
        // Update last typing time for this user and room
        if (isTyping) {
          lastTypingEvents.set(typingKey, now);
        } else {
          // Clear typing state when stopped
          lastTypingEvents.delete(typingKey);
        }

        // Broadcast typing status to room
        const eventName = isTyping ? "user typing" : "user stopped typing";
        const eventData = {
          userId: user.userId,
          username: user.username,
          timestamp: new Date(),
          roomId: roomId, // Include roomId in the event data
        };

        socket.to(roomId).emit(eventName, eventData);

        logger.debug(
          `User ${userId} ${
            isTyping ? "started" : "stopped"
          } typing in room: ${roomId} - Broadcasting "${eventName}" event to room`
        );

        // Also log the event data for debugging
        logger.debug(`Event data:`, eventData);

        // Send acknowledgment if callback provided
        if (typeof callback === 'function') {
          callback({
            success: true,
            throttled: false
          });
        }
      } else {
        // Event was throttled, still update the timestamp
        lastTypingEvents.set(typingKey, now);

        logger.debug(
          `Throttled typing event from user ${userId} in room: ${roomId}`
        );

        // Send acknowledgment with throttled status if callback provided
        if (typeof callback === 'function') {
          callback({
            success: true,
            throttled: true
          });
        }
      }
    } catch (error) {
      const errorMessage = (error as Error)?.message || "Unknown error with typing indicator";
      logger.error(`Error with typing indicator: ${errorMessage}`);
      socket.emit("error", {
        message: errorMessage,
        context: "typing_indicator_error"
      });

      // Send error in acknowledgment if callback provided
      if (typeof callback === 'function') {
        callback({
          success: false,
          error: errorMessage,
          context: "typing_indicator_error"
        });
      }
    }
  });

  // Enhanced message read receipts with acknowledgment
  socket.on("message read", async ({ messageId, chatId }, callback) => {
    try {
      if (!messageId || !chatId) {
        throw new Error("Invalid messageId or chatId for message read");
      }

      // Mark message as read in database
      const updatedMessage = await markMessageAsRead(messageId, userId);
      if (!updatedMessage) {
        throw new Error("Message not found or already marked as read");
      }

      // Transform message to ensure all media URLs are full URLs
      const transformedMessage = ensureFullMediaUrls(updatedMessage);

      // Broadcast read receipt to room
      io.to(chatId).emit("message read confirmation", {
        messageId,
        userId,
        readAt: new Date(),
        message: transformedMessage
      });

      logger.info(`Message ${messageId} marked as read by user ${userId}`);

      // Send acknowledgment if callback provided
      if (typeof callback === 'function') {
        callback({
          success: true,
          messageId,
          readAt: new Date()
        });
      }
    } catch (error: any) {
      const errorMessage =
        error?.message || "Unknown error marking message as read";
      logger.error(`Error marking message as read: ${errorMessage}`, error);

      // Send error to sender
      socket.emit("error", {
        message: `Failed to mark message as read: ${errorMessage}`,
        context: "message_read_error"
      });

      // Send error in acknowledgment if callback provided
      if (typeof callback === 'function') {
        callback({
          success: false,
          error: errorMessage,
          context: "message_read_error"
        });
      }
    }
  });

  // Bulk mark messages as read with acknowledgment
  socket.on("mark messages read", async ({ chatId }, callback) => {
    try {
      if (!chatId) {
        throw new Error("Chat ID is required");
      }

      // Get all unread messages in the chat
      const messages = await getMessages(chatId);

      // If no messages, send success with count 0
      if (!messages || messages.length === 0) {
        logger.info(`No unread messages found in chat ${chatId} for user ${userId}`);

        if (typeof callback === 'function') {
          callback({
            success: true,
            count: 0,
            chatId,
            readAt: new Date()
          });
        }
        return;
      }

      // Mark each message as read - filter out messages without valid IDs
      const readPromises = messages
        .filter(msg => msg && msg.id) // Only process messages with valid IDs
        .map((msg) => markMessageAsRead(msg.id.toString(), userId));

      const results = await Promise.all(readPromises);

      // Transform messages to ensure all media URLs are full URLs
      const transformedMessages = results.map(msg => ensureFullMediaUrls(msg));

      // Broadcast read receipts
      io.to(chatId).emit("messages bulk read", {
        userId,
        chatId,
        count: transformedMessages.length,
        readAt: new Date(),
        messages: transformedMessages
      });

      logger.info(
        `All messages (${transformedMessages.length}) in chat ${chatId} marked as read by user ${userId}`
      );

      // Send acknowledgment if callback provided
      if (typeof callback === 'function') {
        callback({
          success: true,
          count: transformedMessages.length,
          chatId,
          readAt: new Date()
        });
      }
    } catch (error: any) {
      const errorMessage =
        error?.message || "Unknown error marking messages as read";
      logger.error(`Error marking messages as read: ${errorMessage}`, error);

      // Send error to sender
      socket.emit("error", {
        message: `Failed to mark messages as read: ${errorMessage}`,
        context: "bulk_read_error"
      });

      // Send error in acknowledgment if callback provided
      if (typeof callback === 'function') {
        callback({
          success: false,
          error: errorMessage,
          context: "bulk_read_error"
        });
      }
    }
  });

  // Test handlers for debugging
  socket.on("ping", (data, callback) => {
    try {
      logger.info(`Ping received from user ${userId}:`, data);

      if (typeof callback === 'function') {
        callback({
          success: true,
          timestamp: new Date().toISOString(),
          userId: userId,
          socketId: socket.id,
          message: "Pong!"
        });
      }
    } catch (error) {
      logger.error("Error handling ping:", error);
      if (typeof callback === 'function') {
        callback({
          success: false,
          error: (error as Error).message
        });
      }
    }
  });

  socket.on("check-user-online", (data, callback) => {
    try {
      const targetUserId = data.userId;
      logger.info(`Checking if user ${targetUserId} is online (requested by ${userId})`);

      const isOnline = isUserOnline(targetUserId);
      const socketIds = getUserSocketIds(targetUserId);

      logger.info(`User ${targetUserId} online status: ${isOnline}, socket count: ${socketIds.length}`);

      if (typeof callback === 'function') {
        callback({
          success: true,
          online: isOnline,
          socketCount: socketIds.length,
          socketIds: socketIds,
          timestamp: new Date().toISOString()
        });
      }
    } catch (error) {
      logger.error("Error checking user online status:", error);
      if (typeof callback === 'function') {
        callback({
          success: false,
          error: (error as Error).message
        });
      }
    }
  });

  socket.on("get-online-users", (data, callback) => {
    try {
      const onlineUsers = getAllOnlineUsers();

      logger.info(`Online users requested by ${userId}. Found ${onlineUsers.length} users`);

      if (typeof callback === 'function') {
        callback({
          success: true,
          users: onlineUsers
        });
      }
    } catch (error) {
      logger.error("Error getting online users:", error);
      if (typeof callback === 'function') {
        callback({
          success: false,
          error: (error as Error).message
        });
      }
    }
  });
};
