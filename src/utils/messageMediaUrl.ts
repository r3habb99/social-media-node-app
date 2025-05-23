import { IMessage } from "../interfaces";
import { getFullMediaUrl } from "./mediaUrl";

/**
 * Transforms all media URLs in a message to full URLs
 * @param message - The message object to transform
 * @returns The message object with transformed media URLs
 */
export const transformMessageMediaUrls = (message: IMessage | null): IMessage | null => {
  if (!message) return null;

  // Create a new object to avoid modifying the original
  const messageObj = message.toObject ? message.toObject() : { ...message };

  // Transform profile picture URL of the sender if it exists
  if (messageObj.sender && typeof messageObj.sender === 'object' && messageObj.sender.profilePic) {
    messageObj.sender.profilePic = getFullMediaUrl(messageObj.sender.profilePic);
  }

  // Transform cover photo URL of the sender if it exists
  if (messageObj.sender && typeof messageObj.sender === 'object' && messageObj.sender.coverPhoto) {
    messageObj.sender.coverPhoto = getFullMediaUrl(messageObj.sender.coverPhoto);
  }

  // Transform media URLs if they exist
  if (messageObj.media && Array.isArray(messageObj.media)) {
    messageObj.media = messageObj.media.map((url: string) => getFullMediaUrl(url));
  }

  // Transform profile pictures in readBy array
  if (messageObj.readBy && Array.isArray(messageObj.readBy)) {
    messageObj.readBy = messageObj.readBy.map((user: any) => {
      if (typeof user === 'object' && user.profilePic) {
        return {
          ...user,
          profilePic: getFullMediaUrl(user.profilePic),
          coverPhoto: user.coverPhoto ? getFullMediaUrl(user.coverPhoto) : user.coverPhoto
        };
      }
      return user;
    });
  }

  // Transform replyTo message if it exists
  if (messageObj.replyTo && typeof messageObj.replyTo === 'object') {
    // Avoid infinite recursion by only transforming one level deep
    const replyToObj = messageObj.replyTo.toObject ? messageObj.replyTo.toObject() : { ...messageObj.replyTo };

    if (replyToObj.sender && typeof replyToObj.sender === 'object' && replyToObj.sender.profilePic) {
      replyToObj.sender.profilePic = getFullMediaUrl(replyToObj.sender.profilePic);
    }

    if (replyToObj.media && Array.isArray(replyToObj.media)) {
      replyToObj.media = replyToObj.media.map((url: string) => getFullMediaUrl(url));
    }

    messageObj.replyTo = replyToObj;
  }

  return messageObj as unknown as IMessage;
};

/**
 * Transforms all media URLs in an array of messages
 * @param messages - Array of message objects
 * @returns Array of message objects with transformed media URLs
 */
export const transformMessagesMediaUrls = (messages: IMessage[]): IMessage[] => {
  return messages.map(message => transformMessageMediaUrls(message)).filter(Boolean) as IMessage[];
};
