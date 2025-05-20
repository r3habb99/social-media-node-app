import { Server as HTTPServer } from "http";
import { Server, Socket } from "socket.io";
import { logger } from "./services";
import { saveMessage, markMessageAsRead, getMessages } from "./queries";
import { Chat } from "./entities";
import { ALLOWED_ORIGINS } from "./constants/urls";


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

// Function to emit notification to a specific user
export const emitNotification = (io: Server, userId: string, notification: any) => {
  try {
    const socketIds = userSockets.get(userId);
    if (socketIds && socketIds.length > 0) {
      // Send notification to all user's connected devices
      socketIds.forEach(socketId => {
        io.to(socketId).emit('notification', notification);
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

export const initializeSocket = (httpServer: HTTPServer): Server => {
  const io = new Server(httpServer, {
    cors: {
      origin: ALLOWED_ORIGINS,
      methods: ["GET", "POST"],
      allowedHeaders: ["Content-Type", "Authorization"],
      credentials: true,
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
    logger.info(`🔌 User connected: ${userId} (Socket ID: ${socket.id})`);

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

    // Emit online status to all users
    io.emit("user online", { userId });

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

    // Handle sending a new message
    socket.on("new message", async (message) => {
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

        // Save message to DB
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

          // Broadcast message to room
          io.to(chatRoomId).emit("message received", savedMessage);

          // Confirm delivery to sender
          socket.emit("message delivered", {
            messageId: savedMessage._id,
            timestamp: new Date(),
          });
        }

        logger.info(
          `📨 Message from ${userId} saved and broadcasted to room: ${chatRoomId}`
        );
      } catch (error: any) {
        const errorMessage = error?.message || "Unknown error sending message";
        logger.error(`Error sending message: ${errorMessage}`, error);
        socket.emit("error", {
          message: `Failed to send message: ${errorMessage}`,
        });
      }
    });

    // Enhanced typing indicators with debounce information
    socket.on("typing", (data) => {
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
      } catch (error) {
        const errorMessage = (error as Error)?.message || "Unknown error with typing indicator";
        logger.error(`Error with typing indicator: ${errorMessage}`);
        socket.emit("error", { message: errorMessage });
      }
    });

    // Enhanced message read receipts
    socket.on("message read", async ({ messageId, chatId }) => {
      try {
        if (!messageId || !chatId) {
          throw new Error("Invalid messageId or chatId for message read");
        }

        // Mark message as read in database
        const updatedMessage = await markMessageAsRead(messageId, userId);
        if (!updatedMessage) {
          throw new Error("Message not found or already marked as read");
        }

        // Broadcast read receipt to room
        io.to(chatId).emit("message read confirmation", {
          messageId,
          userId,
          readAt: new Date(),
        });

        logger.info(`Message ${messageId} marked as read by user ${userId}`);
      } catch (error: any) {
        const errorMessage =
          error?.message || "Unknown error marking message as read";
        logger.error(`Error marking message as read: ${errorMessage}`, error);
        socket.emit("error", {
          message: `Failed to mark message as read: ${errorMessage}`,
        });
      }
    });

    // Bulk mark messages as read
    socket.on("mark messages read", async ({ chatId }) => {
      try {
        if (!chatId) {
          throw new Error("Chat ID is required");
        }

        // Get all unread messages in the chat
        const messages = await getMessages(chatId);
        if (!messages || messages.length === 0) {
          return;
        }

        // Mark each message as read
        const readPromises = messages.map((msg) =>
          markMessageAsRead(msg.id.toString(), userId)
        );

        await Promise.all(readPromises);

        // Broadcast read receipts
        io.to(chatId).emit("messages bulk read", {
          userId,
          chatId,
          readAt: new Date(),
        });

        logger.info(
          `All messages in chat ${chatId} marked as read by user ${userId}`
        );
      } catch (error: any) {
        const errorMessage =
          error?.message || "Unknown error marking messages as read";
        logger.error(`Error marking messages as read: ${errorMessage}`, error);
        socket.emit("error", {
          message: `Failed to mark messages as read: ${errorMessage}`,
        });
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
    });
  });

  return io;
};
