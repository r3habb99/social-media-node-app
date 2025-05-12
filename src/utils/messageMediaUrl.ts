import { IMessage } from "../interfaces";
import { getFullMediaUrl } from "./mediaUrl";

/**
 * Transforms user profile picture URLs in a message to full URLs
 * @param message - The message object to transform
 * @returns The message object with transformed profile picture URLs
 */
export const transformMessageMediaUrls = (message: IMessage | null): IMessage | null => {
  if (!message) return null;

  // Create a new object to avoid modifying the original
  const messageObj = message.toObject ? message.toObject() : { ...message };

  // Transform profile picture URL of the sender if it exists
  if (messageObj.sender && messageObj.sender.profilePic) {
    messageObj.sender.profilePic = getFullMediaUrl(messageObj.sender.profilePic);
  }

  return messageObj as unknown as IMessage;
};

/**
 * Transforms user profile picture URLs in an array of messages
 * @param messages - Array of message objects
 * @returns Array of message objects with transformed profile picture URLs
 */
export const transformMessagesMediaUrls = (messages: IMessage[]): IMessage[] => {
  return messages.map(message => transformMessageMediaUrls(message)).filter(Boolean) as IMessage[];
};
