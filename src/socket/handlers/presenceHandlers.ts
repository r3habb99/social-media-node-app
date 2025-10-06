import { Server, Socket } from "socket.io";
import { logger } from "../../services";
import { 
  addActiveUser, 
  removeActiveUser, 
  getUserRooms, 
  getActiveUser,
  cleanupUserData,
  isUserOnline
} from "../utils/socketUtils";

/**
 * Handle reconnection for a user
 */
const handleReconnection = (io: Server, socket: Socket, userId: string) => {
  logger.info(`Handling reconnection for user ${userId}`);

  // Re-join all rooms the user was previously in
  const previousRooms = new Set<string>();

  // Get user's previous rooms (this would need to be stored somewhere persistent)
  // For now, we'll skip this as the user will rejoin rooms as needed

  // Join all previous rooms
  previousRooms.forEach(roomId => {
    socket.join(roomId);
    logger.info(`User ${userId} rejoined room ${roomId} after reconnection`);

    // Notify room that user has reconnected
    socket.to(roomId).emit("user reconnected", {
      userId,
      username: socket.data.username || "Anonymous",
    });
  });

  // Note: Pending messages handling would be implemented here if needed
  // For now, we'll skip this as it requires persistent storage
};

/**
 * Register presence event handlers
 */
export const registerPresenceHandlers = (io: Server, socket: Socket) => {
  const userId = socket.data.userId;
  const username = socket.data.username;
  const isReconnection = socket.recovered;

  logger.info(`🔌 User connected: ${userId} (Socket ID: ${socket.id}, Reconnection: ${isReconnection})`);

  // Add user to active users tracking
  addActiveUser(socket.id, userId, username);

  // Handle reconnection if applicable
  if (isReconnection) {
    handleReconnection(io, socket, userId);
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
    handleReconnection(io, socket, userId);
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

  // Handle user status updates
  socket.on("user:status", (data, callback) => {
    try {
      const { status, message } = data;
      
      // Validate status
      const validStatuses = ['online', 'away', 'busy', 'offline'];
      if (!validStatuses.includes(status)) {
        throw new Error("Invalid status");
      }

      // Broadcast status update to all connected users
      socket.broadcast.emit("user status updated", {
        userId,
        status,
        message: message || '',
        timestamp: new Date()
      });

      logger.info(`User ${userId} status updated to: ${status}`);

      // Send acknowledgment if callback provided
      if (typeof callback === 'function') {
        callback({
          success: true,
          status,
          timestamp: new Date()
        });
      }
    } catch (error: any) {
      const errorMessage = error?.message || "Unknown error updating status";
      logger.error(`Error updating user status: ${errorMessage}`, error);

      socket.emit("error", {
        message: errorMessage,
        context: "status_update_failed"
      });

      if (typeof callback === 'function') {
        callback({
          success: false,
          error: errorMessage
        });
      }
    }
  });

  // Handle user activity updates (typing, last seen, etc.)
  socket.on("user:activity", (data, callback) => {
    try {
      const { activity, roomId } = data;
      
      // Validate activity type
      const validActivities = ['typing', 'viewing', 'idle'];
      if (!validActivities.includes(activity)) {
        throw new Error("Invalid activity type");
      }

      // If roomId is provided, broadcast to that room only
      if (roomId) {
        socket.to(roomId).emit("user activity", {
          userId,
          activity,
          roomId,
          timestamp: new Date()
        });
      } else {
        // Broadcast to all connected users
        socket.broadcast.emit("user activity", {
          userId,
          activity,
          timestamp: new Date()
        });
      }

      logger.debug(`User ${userId} activity: ${activity} ${roomId ? `in room ${roomId}` : ''}`);

      // Send acknowledgment if callback provided
      if (typeof callback === 'function') {
        callback({
          success: true,
          activity,
          timestamp: new Date()
        });
      }
    } catch (error: any) {
      const errorMessage = error?.message || "Unknown error updating activity";
      logger.error(`Error updating user activity: ${errorMessage}`, error);

      socket.emit("error", {
        message: errorMessage,
        context: "activity_update_failed"
      });

      if (typeof callback === 'function') {
        callback({
          success: false,
          error: errorMessage
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
      const user = getActiveUser(socket.id);
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

      // Clean up user data
      cleanupUserData(socket.id, userId);

      // Check if user is still online on other devices
      if (!isUserOnline(userId)) {
        // Broadcast offline status only if user has no more active connections
        io.emit("user offline", { userId });
        logger.info(`User ${userId} is now offline`);
      } else {
        logger.info(`User ${userId} still has active connections`);
      }
    } catch (error: any) {
      const errorMessage =
        error?.message || "Unknown error handling disconnect";
      logger.error(`Error handling disconnect: ${errorMessage}`, error);
    }
  });
};
