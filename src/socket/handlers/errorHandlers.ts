import { Server, Socket } from "socket.io";
import { logger } from "../../services";

/**
 * Register error handling event handlers
 */
export const registerErrorHandlers = (io: Server, socket: Socket) => {
  const userId = socket.data.userId;

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

  // Handle connection errors
  socket.on("connect_error", (error) => {
    logger.error(`Connection error for user ${userId}: ${error.message}`);
  });

  // Handle timeout errors
  socket.on("timeout", () => {
    logger.warn(`Socket timeout for user ${userId}`);
    
    socket.emit("server error", {
      message: "Connection timeout",
      timestamp: new Date(),
      context: "socket_timeout"
    });
  });
};

/**
 * Register global error handlers for the socket.io server
 */
export const registerGlobalErrorHandlers = (io: Server) => {
  // Global error handler for the socket.io server
  io.engine.on("connection_error", (err) => {
    logger.error(`Connection error: ${err.message}`, err);
  });

  // Handle server-side errors
  io.on("error", (error) => {
    logger.error(`Socket.io server error: ${error.message}`, error);
  });
};
