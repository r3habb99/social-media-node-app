import { IUser } from "../interfaces";
import { getFullMediaUrl } from "./mediaUrl";

/**
 * Transforms user media URLs (profile picture and cover photo) to full URLs
 * @param user - The user object to transform
 * @returns The user object with transformed media URLs
 */
export const transformUserMediaUrls = (user: IUser | null): IUser | null => {
  if (!user) return null;

  // Create a new object to avoid modifying the original
  const userObj = user.toObject ? user.toObject() : { ...user };

  // Transform profile picture URL if it exists
  if (userObj.profilePic) {
    userObj.profilePic = getFullMediaUrl(userObj.profilePic);
  }

  // Transform cover photo URL if it exists
  if (userObj.coverPhoto) {
    userObj.coverPhoto = getFullMediaUrl(userObj.coverPhoto);
  }

  return userObj as unknown as IUser;
};

/**
 * Transforms media URLs in an array of users
 * @param users - Array of user objects
 * @returns Array of user objects with transformed media URLs
 */
export const transformUsersMediaUrls = (users: IUser[]): IUser[] => {
  return users.map(user => transformUserMediaUrls(user)).filter(Boolean) as IUser[];
};
