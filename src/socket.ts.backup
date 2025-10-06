import { Server as HTTPServer } from "http";
import { Server, Socket } from "socket.io";
import { logger } from "./services";
import { saveMessage, markMessageAsRead, getMessages } from "./queries";
import { Chat } from "./entities";
import { ALLOWED_ORIGINS, SERVER_BASE_URL } from "./constants/urls";
import { getFullMediaUrl } from "./utils/mediaUrl";
import { transformMessageMediaUrls } from "./utils/messageMediaUrl";


// Interface for socket user data
interface SocketUser {
  userId: string;
  username: string;
  rooms: string[];
}

// Map to store active users
const activeUsers = new Map<string, SocketUser>();

// Map to store user's socket IDs (userId -> socketId)
const userSockets = new Map<string, string[]>();

/**
 * Ensures all media URLs in an object are properly transformed to full URLs
 * This is a safety check to make sure we never send relative URLs to clients
 */
const ensureFullMediaUrls = (obj: any): any => {
  if (!obj) return obj;

  // If it's not an object, return as is
  if (typeof obj !== 'object') return obj;

  // If it's an array, process each item
  if (Array.isArray(obj)) {
    return obj.map(item => ensureFullMediaUrls(item));
  }

  // Create a new object to avoid modifying the original
  const result = { ...obj };

  // Process each property
  for (const key in result) {
    const value = result[key];

    // Check if this is a media URL field
    if ((key === 'profilePic' || key === 'coverPhoto' || key === 'media') && typeof value === 'string') {
      // Transform the URL if it's not already a full URL
      result[key] = getFullMediaUrl(value);
    }
    // If it's an array of media URLs
    else if (key === 'media' && Array.isArray(value)) {
      result[key] = value.map((url: string) =>
        typeof url === 'string' ? getFullMediaUrl(url) : url
      );
    }
    // Recursively process nested objects
    else if (typeof value === 'object' && value !== null) {
      result[key] = ensureFullMediaUrls(value);
    }
  }

  return result;
};

// Function to emit notification to a specific user
export const emitNotification = (io: Server, userId: string, notification: any) => {
  try {
    const socketIds = userSockets.get(userId);
    if (socketIds && socketIds.length > 0) {
      // Ensure all media URLs are properly transformed
      const transformedNotification = ensureFullMediaUrls(notification);

      // Send notification to all user's connected devices
      socketIds.forEach(socketId => {
        io.to(socketId).emit('notification', transformedNotification);
      });
      logger.info(`Notification sent to user ${userId}`);
      return true;
    } else {
      logger.info(`User ${userId} is not connected, notification not sent in real-time`);
      return false;
    }
  } catch (error) {
    logger.error(`Error sending notification to user ${userId}:`, error);
    return false;
  }};

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

// Function to handle reconnection for a user
const handleReconnection = (socket: Socket, userId: string) => {
  logger.info(`Handling reconnection for user ${userId}`);

  // Re-join all rooms the user was previously in
  const previousRooms = new Set<string>();

  // Collect all rooms from all of the user's previous connections
  const socketIds = userSockets.get(userId) || [];
  socketIds.forEach(socketId => {
    const user = activeUsers.get(socketId);
    if (user) {
      user.rooms.forEach(room => previousRooms.add(room));
    }
  });

  // Join all previous rooms
  previousRooms.forEach(roomId => {
    socket.join(roomId);
    logger.info(`User ${userId} rejoined room ${roomId} after reconnection`);

    // Update user's rooms list
    const user = activeUsers.get(socket.id);
    if (user && !user.rooms.includes(roomId)) {
      user.rooms.push(roomId);
      activeUsers.set(socket.id, user);
    }

    // Notify room that user has reconnected
    socket.to(roomId).emit("user reconnected", {
      userId,
      username: socket.handshake.auth.username || "Anonymous",
    });
  });

  // Resend any pending messages
  const userPendingMessages = pendingMessages.get(userId);
  if (userPendingMessages && userPendingMessages.length > 0) {
    logger.info(`Resending ${userPendingMessages.length} pending messages for user ${userId}`);

    // Process each pending message
    userPendingMessages.forEach(async (pendingMsg) => {
      try {
        // Attempt to resend the message
        socket.emit("resend message", {
          id: pendingMsg.id,
          content: pendingMsg.content,
          chatId: pendingMsg.chatId,
          timestamp: pendingMsg.timestamp
        });
      } catch (error) {
        logger.error(`Failed to resend message ${pendingMsg.id} for user ${userId}:`, error);
      }
    });
  }
};

export const initializeSocket = (httpServer: HTTPServer): Server => {
  const io = new Server(httpServer, {
    cors: {
      origin: ALLOWED_ORIGINS,
      methods: ["GET", "POST"],
      allowedHeaders: ["Content-Type", "Authorization"],
      credentials: true,
    },
    // Add reconnection settings
    connectionStateRecovery: {
      // The backup duration of the sessions and the packets
      maxDisconnectionDuration: 2 * 60 * 1000, // 2 minutes
      // Whether to skip middlewares upon successful recovery
      skipMiddlewares: true,
    },
  });

  // Middleware for authentication and error handling
  io.use(async (socket, next) => {
    try {
      const userId = socket.handshake.auth.userId;
      if (!userId) {
        return next(new Error("Authentication error: User ID is required"));
      }

      // Store user information in the socket
      socket.data.userId = userId;
      next();
    } catch (error) {
      logger.error("Socket authentication error:", error);
      next(new Error("Authentication failed"));
    }
  });

  io.on("connection", (socket: Socket) => {
    const userId = socket.data.userId;
    const isReconnection = socket.recovered;

    logger.info(`🔌 User connected: ${userId} (Socket ID: ${socket.id}, Reconnection: ${isReconnection})`);

    // Add user to active users map
    activeUsers.set(socket.id, {
      userId,
      username: socket.handshake.auth.username || "Anonymous",
      rooms: [],
    });

    // Track user's socket ID
    if (!userSockets.has(userId)) {
      userSockets.set(userId, []);
    }
    userSockets.get(userId)?.push(socket.id);

    // Handle reconnection if applicable
    if (isReconnection) {
      handleReconnection(socket, userId);
    } else {
      // Only emit online status for new connections, not reconnections
      io.emit("user online", { userId });
    }

    // Add event listener for reconnection attempts from client
    socket.on("reconnect_attempt", () => {
      logger.info(`Reconnection attempt from user ${userId}`);
    });

    // Add event listener for successful reconnection
    socket.on("reconnect", () => {
      logger.info(`User ${userId} successfully reconnected`);
      handleReconnection(socket, userId);
    });

    // Join a chat room
    socket.on("join room", (roomId, callback) => {
      try {
        if (!roomId) {
          throw new Error("Invalid room ID");
        }

        socket.join(roomId);

        // Update user's rooms list
        const user = activeUsers.get(socket.id);
        if (user && !user.rooms.includes(roomId)) {
          user.rooms.push(roomId);
          activeUsers.set(socket.id, user);
        }

        // Notify room that user has joined
        socket.to(roomId).emit("user joined", {
          userId: user?.userId,
          username: user?.username,
        });

        logger.info(`User ${userId} joined room: ${roomId}`);

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

        // Update user's rooms list
        const user = activeUsers.get(socket.id);
        if (user) {
          user.rooms = user.rooms.filter((id) => id !== roomId);
          activeUsers.set(socket.id, user);

          // Notify room that user has left
          socket.to(roomId).emit("user left", {
            userId: user.userId,
            username: user.username,
          });
        }

        logger.info(`User ${userId} left room: ${roomId}`);
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
        const chatRoomId =
          message.chat?._id || message.chat?.id || message.chat;
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
        if (savedMessage && savedMessage._id) {
          await Chat.findByIdAndUpdate(chatRoomId, {
            latestMessage: savedMessage._id,
          });

          // Transform message to ensure all media URLs are full URLs
          const transformedMessage = ensureFullMediaUrls({
            ...savedMessage,
            status: "delivered"
          });

          // Broadcast message to room
          io.to(chatRoomId).emit("message received", transformedMessage);

          // Confirm delivery to sender
          socket.emit("message delivered", {
            messageId: savedMessage._id,
            timestamp: new Date(),
            status: "delivered"
          });

          // Send acknowledgment if callback provided
          if (typeof callback === 'function') {
            callback({
              success: true,
              messageId: savedMessage._id,
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

    // Map to track last typing event time per room
    const lastTypingEvents = new Map<string, number>();
    // Throttle interval for typing events (milliseconds)
    const TYPING_THROTTLE_MS = 3000; // 3 seconds

    // Enhanced typing indicators with throttling
    socket.on("typing", (data, callback) => {
      try {
        // Support both roomId and chatId in payload
        const roomId = data.roomId || data.chatId;
        const isTyping = data.isTyping !== undefined ? data.isTyping : true;

        if (!roomId) {
          throw new Error("Invalid room ID for typing event");
        }

        const user = activeUsers.get(socket.id);
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
          socket
            .to(roomId)
            .emit(isTyping ? "user typing" : "user stopped typing", {
              userId: user.userId,
              username: user.username,
              timestamp: new Date(),
            });

          logger.debug(
            `User ${userId} ${
              isTyping ? "started" : "stopped"
            } typing in room: ${roomId}`
          );

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

    // Handle disconnection and user presence update
    socket.on("disconnect", async (reason) => {
      logger.info(
        `🔴 User disconnected: ${userId} (Socket ID: ${socket.id}), Reason: ${reason}`
      );

      try {
        // Get user's rooms before removing from active users
        const user = activeUsers.get(socket.id);
        if (user) {
          // Notify all rooms that user has left
          user.rooms.forEach((roomId) => {
            socket.to(roomId).emit("user left", {
              userId: user.userId,
              username: user.username,
              reason,
            });
          });
        }

        // Remove user from active users map
        activeUsers.delete(socket.id);

        // Remove socket from user's sockets list
        if (userSockets.has(userId)) {
          const userSocketIds = userSockets.get(userId) || [];
          const updatedSocketIds = userSocketIds.filter(id => id !== socket.id);

          if (updatedSocketIds.length === 0) {
            // If no more sockets for this user, remove the user entry
            userSockets.delete(userId);
            // Broadcast offline status only if user has no more active connections
            io.emit("user offline", { userId });
          } else {
            // Update the user's socket list
            userSockets.set(userId, updatedSocketIds);
          }
        } else {
          // Broadcast offline status
          io.emit("user offline", { userId });
        }

        logger.info(`User ${userId} is now offline`);
      } catch (error: any) {
        const errorMessage =
          error?.message || "Unknown error handling disconnect";
        logger.error(`Error handling disconnect: ${errorMessage}`, error);
      }
    });

    // Error handling for uncaught events
    socket.on("error", (error) => {
      logger.error(`Socket error for user ${userId}: ${error.message}`);

      // Notify client of the error
      socket.emit("server error", {
        message: "An unexpected error occurred",
        timestamp: new Date(),
        context: "uncaught_socket_error"
      });
    });

    // Handle client-side errors reported by the frontend
    socket.on("client error", (errorData) => {
      logger.error(`Client-side error reported by user ${userId}:`, errorData);

      // Acknowledge receipt of error report
      socket.emit("error received", {
        timestamp: new Date(),
        errorId: errorData.id || Date.now()
      });
    });

    // Handle ping/heartbeat to detect connection issues
    socket.on("ping", (callback) => {
      if (typeof callback === 'function') {
        callback({
          timestamp: new Date(),
          userId: userId
        });
      }
    });
  });

  // Global error handler for the socket.io server
  io.engine.on("connection_error", (err) => {
    logger.error(`Connection error: ${err.message}`, err);
  });

  return io;
};
