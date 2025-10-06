import { Server as HTTPServer } from "http";
import { Server, Socket } from "socket.io";
import { logger } from "../services";
import { ALLOWED_ORIGINS } from "../constants/urls";
import { socketAuthMiddleware } from "./middleware/authMiddleware";
import { registerChatHandlers } from "./handlers/chatHandlers";
import { registerWebRTCHandlers } from "./handlers/webrtcHandlers";
import { registerPresenceHandlers } from "./handlers/presenceHandlers";
import { registerErrorHandlers, registerGlobalErrorHandlers } from "./handlers/errorHandlers";

/**
 * Initialize Socket.io server with modular handlers
 */
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

  // Register global error handlers
  registerGlobalErrorHandlers(io);

  // Middleware for authentication and error handling
  io.use(socketAuthMiddleware);

  // Handle new socket connections
  io.on("connection", (socket: Socket) => {
    const userId = socket.data.userId;
    const username = socket.data.username;

    logger.info(`🔌 New socket connection: ${userId} (${username}) - Socket ID: ${socket.id}`);

    try {
      // Register all event handlers for this socket
      registerPresenceHandlers(io, socket);
      registerChatHandlers(io, socket);
      registerWebRTCHandlers(io, socket);
      registerErrorHandlers(io, socket);

      logger.info(`✅ All handlers registered for user: ${userId}`);
    } catch (error) {
      logger.error(`❌ Error registering handlers for user ${userId}:`, error);
      socket.emit("server error", {
        message: "Failed to initialize connection",
        timestamp: new Date(),
        context: "handler_registration_failed"
      });
      socket.disconnect(true);
    }
  });

  logger.info("🚀 Socket.io server initialized with modular handlers");
  return io;
};

// Export utility functions for external use
export { emitToUser, emitToUsers, isUserOnline, getOnlineUserIds } from "./utils/socketUtils";
export { callManager } from "./utils/callManager";
export * from "./types/webrtc.types";
