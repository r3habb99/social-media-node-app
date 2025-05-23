export * from "./User.queries";
export * from "./Token.queries";
export * from "./Search.queries";

// Import and re-export ProfilePic queries with renamed functions to avoid conflicts
import {
  updateUserImage,
  getUserById as getUserByIdFromProfilePic,
  getUserForPassword,
} from "./ProfilePic.queries";

export { updateUserImage, getUserByIdFromProfilePic, getUserForPassword };

export * from "./FollowerService.queries";
export * from "./NotificationService.queries";
export * from "./Post.queries";
export * from "./Comment.queries";

// Import and re-export chat queries with specific names to avoid conflicts
import {
  createChat,
  fetchUserMessages,
  getMessages as getChatMessages,
  addUserToGroup,
  removeUserFromGroup,
  updateGroupName,
  getUnreadMessageCount,
  archiveChat,
} from "./chat.queries";

// Import and re-export message queries
import {
  saveMessage,
  markMessageAsRead,
  deleteMessageById,
  editMessageById,
  getMessages,
  searchMessages,
  getMessageById
} from "./message.queries";

// Re-export all with specific names
export {
  createChat,
  fetchUserMessages,
  getChatMessages,
  addUserToGroup,
  removeUserFromGroup,
  updateGroupName,
  getUnreadMessageCount,
  archiveChat,
  saveMessage,
  markMessageAsRead,
  deleteMessageById,
  editMessageById,
  getMessages,
  searchMessages,
  getMessageById
};
