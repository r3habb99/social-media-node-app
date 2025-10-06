import { Socket } from "socket.io";
import { ExtendedError } from "socket.io/dist/namespace";
import { logger } from "../../services";

/**
 * Socket authentication middleware
 * Validates user authentication before allowing socket connection
 */
export const socketAuthMiddleware = async (
  socket: Socket, 
  next: (err?: ExtendedError) => void
) => {
  try {
    const userId = socket.handshake.auth.userId;
    const username = socket.handshake.auth.username;

    // Validate required authentication data
    if (!userId) {
      logger.warn(`Socket connection rejected: Missing user ID`);
      return next(new Error("Authentication error: User ID is required"));
    }

    if (!username) {
      logger.warn(`Socket connection rejected: Missing username for user ${userId}`);
      return next(new Error("Authentication error: Username is required"));
    }

    // Store user information in the socket
    socket.data.userId = userId;
    socket.data.username = username;

    // Optional: Validate token if provided
    const token = socket.handshake.auth.token;
    if (token) {
      // Here you could add JWT token validation if needed
      // For now, we'll just store it
      socket.data.token = token;
    }

    logger.info(`Socket authentication successful for user: ${userId} (${username})`);
    next();
  } catch (error) {
    logger.error("Socket authentication error:", error);
    next(new Error("Authentication failed"));
  }
};
