import { Server, Socket } from "socket.io";
import { logger } from "../../services";
import { getFullMediaUrl } from "../../utils/mediaUrl";

// Interface for socket user data
export interface SocketUser {
  userId: string;
  username: string;
  rooms: string[];
}

// Map to store active users
export const activeUsers = new Map<string, SocketUser>();

// Map to store user's socket IDs (userId -> socketId[])
export const userSockets = new Map<string, string[]>();

/**
 * Ensures all media URLs in an object are properly transformed to full URLs
 * This is a safety check to make sure we never send relative URLs to clients
 */
export const ensureFullMediaUrls = (obj: any): any => {
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

/**
 * Add user to active users tracking
 */
export const addActiveUser = (socketId: string, userId: string, username: string): void => {
  activeUsers.set(socketId, {
    userId,
    username,
    rooms: [],
  });

  // Track user's socket ID
  if (!userSockets.has(userId)) {
    userSockets.set(userId, []);
  }
  userSockets.get(userId)?.push(socketId);

  logger.info(`User ${userId} added to active users (Socket: ${socketId})`);
};

/**
 * Remove user from active users tracking
 */
export const removeActiveUser = (socketId: string, userId: string): void => {
  // Remove user from active users map
  activeUsers.delete(socketId);

  // Remove socket from user's sockets list
  if (userSockets.has(userId)) {
    const userSocketIds = userSockets.get(userId) || [];
    const updatedSocketIds = userSocketIds.filter(id => id !== socketId);

    if (updatedSocketIds.length === 0) {
      // If no more sockets for this user, remove the user entry
      userSockets.delete(userId);
    } else {
      // Update the user's socket list
      userSockets.set(userId, updatedSocketIds);
    }
  }

  logger.info(`User ${userId} removed from active users (Socket: ${socketId})`);
};

/**
 * Get user's socket IDs
 */
export const getUserSocketIds = (userId: string): string[] => {
  return userSockets.get(userId) || [];
};

/**
 * Check if user is online
 */
export const isUserOnline = (userId: string): boolean => {
  return userSockets.has(userId) && (userSockets.get(userId)?.length || 0) > 0;
};

/**
 * Get all online users
 */
export const getAllOnlineUsers = (): Array<{userId: string, username: string, socketCount: number}> => {
  const onlineUsers: Array<{userId: string, username: string, socketCount: number}> = [];

  userSockets.forEach((socketIds, userId) => {
    if (socketIds.length > 0) {
      // Get username from any of the user's active sockets
      const firstSocketId = socketIds[0];
      const user = activeUsers.get(firstSocketId);

      onlineUsers.push({
        userId,
        username: user?.username || 'Unknown',
        socketCount: socketIds.length
      });
    }
  });

  return onlineUsers;
};

/**
 * Get active user by socket ID
 */
export const getActiveUser = (socketId: string): SocketUser | undefined => {
  return activeUsers.get(socketId);
};

/**
 * Add user to room
 */
export const addUserToRoom = (socketId: string, roomId: string): void => {
  const user = activeUsers.get(socketId);
  if (user && !user.rooms.includes(roomId)) {
    user.rooms.push(roomId);
    activeUsers.set(socketId, user);
  }
};

/**
 * Remove user from room
 */
export const removeUserFromRoom = (socketId: string, roomId: string): void => {
  const user = activeUsers.get(socketId);
  if (user) {
    user.rooms = user.rooms.filter((id) => id !== roomId);
    activeUsers.set(socketId, user);
  }
};

/**
 * Get all rooms for a user
 */
export const getUserRooms = (socketId: string): string[] => {
  const user = activeUsers.get(socketId);
  return user ? user.rooms : [];
};

/**
 * Emit to specific user across all their connected devices
 */
export const emitToUser = (io: Server, userId: string, event: string, data: any): boolean => {
  try {
    const socketIds = getUserSocketIds(userId);
    if (socketIds.length > 0) {
      // Ensure all media URLs are properly transformed
      const transformedData = ensureFullMediaUrls(data);

      // Send to all user's connected devices
      socketIds.forEach(socketId => {
        io.to(socketId).emit(event, transformedData);
      });
      
      logger.info(`Event '${event}' sent to user ${userId} on ${socketIds.length} device(s)`);
      return true;
    } else {
      logger.info(`User ${userId} is not connected, event '${event}' not sent`);
      return false;
    }
  } catch (error) {
    logger.error(`Error sending event '${event}' to user ${userId}:`, error);
    return false;
  }
};

/**
 * Emit to specific users
 */
export const emitToUsers = (io: Server, userIds: string[], event: string, data: any): void => {
  userIds.forEach(userId => {
    emitToUser(io, userId, event, data);
  });
};

/**
 * Get all active users count
 */
export const getActiveUsersCount = (): number => {
  return userSockets.size;
};

/**
 * Get all online user IDs
 */
export const getOnlineUserIds = (): string[] => {
  return Array.from(userSockets.keys());
};

/**
 * Clean up user data on disconnect
 */
export const cleanupUserData = (socketId: string, userId: string): void => {
  removeActiveUser(socketId, userId);
  logger.info(`Cleaned up data for user ${userId} (Socket: ${socketId})`);
};
