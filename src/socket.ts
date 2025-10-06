// Backward compatibility export - re-exports from the new modular socket structure
export * from "./socket/index";

// Export the main initialization function for backward compatibility
export { initializeSocket } from "./socket/index";

// Export notification function for backward compatibility
import { Server } from "socket.io";
import { emitToUser } from "./socket/utils/socketUtils";

/**
 * Legacy notification function for backward compatibility
 * @deprecated Use emitToUser from socket/utils/socketUtils instead
 */
export const emitNotification = (io: Server, userId: string, notification: any) => {
  return emitToUser(io, userId, 'notification', notification);
};
