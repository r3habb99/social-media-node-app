import { IChat, IPopulatedChat } from "../interfaces";
import { transformUserMediaUrls, transformUsersMediaUrls } from "./userMediaUrl";
import { transformMessageMediaUrls } from "./messageMediaUrl";

/**
 * Transforms user profile picture URLs in a chat to full URLs
 * @param chat - The chat object to transform
 * @returns The chat object with transformed profile picture URLs
 */
export const transformChatMediaUrls = (chat: IChat | null): IChat | null => {
  if (!chat) return null;

  // Create a new object to avoid modifying the original
  const chatObj = chat.toObject ? chat.toObject() : { ...chat };

  // Transform profile picture URLs of users if they exist
  if (chatObj.users && Array.isArray(chatObj.users)) {
    // Check if users are populated (objects with profilePic) or just IDs
    const hasProfilePics = chatObj.users.some((user: any) => user && typeof user === 'object' && user.profilePic);
    
    if (hasProfilePics) {
      chatObj.users = transformUsersMediaUrls(chatObj.users as any);
    }
  }

  // Transform latest message if it exists
  if (chatObj.latestMessage && typeof chatObj.latestMessage === 'object') {
    chatObj.latestMessage = transformMessageMediaUrls(chatObj.latestMessage as any);
  }

  return chatObj as unknown as IChat;
};

/**
 * Transforms user profile picture URLs in an array of chats
 * @param chats - Array of chat objects
 * @returns Array of chat objects with transformed profile picture URLs
 */
export const transformChatsMediaUrls = (chats: IChat[]): IChat[] => {
  return chats.map(chat => transformChatMediaUrls(chat)).filter(Boolean) as IChat[];
};
