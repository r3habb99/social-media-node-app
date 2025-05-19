import { INotification } from "../interfaces";
import { getFullMediaUrl } from "./mediaUrl";

/**
 * Transforms user profile picture URLs in a notification to full URLs
 * @param notification - The notification object to transform
 * @returns The notification object with transformed profile picture URLs
 */
export const transformNotificationMediaUrls = (notification: INotification | null): INotification | null => {
  if (!notification) return null;

  // Create a new object to avoid modifying the original
  const notificationObj = notification.toObject ? notification.toObject() : { ...notification };

  // Transform profile picture URL of userFrom if it exists
  if (notificationObj.userFrom && notificationObj.userFrom.profilePic) {
    notificationObj.userFrom.profilePic = getFullMediaUrl(notificationObj.userFrom.profilePic);
  }

  // Transform profile picture URL of userTo if it exists
  if (notificationObj.userTo && notificationObj.userTo.profilePic) {
    notificationObj.userTo.profilePic = getFullMediaUrl(notificationObj.userTo.profilePic);
  }

  return notificationObj as unknown as INotification;
};

/**
 * Transforms user profile picture URLs in an array of notifications
 * @param notifications - Array of notification objects
 * @returns Array of notification objects with transformed profile picture URLs
 */
export const transformNotificationsMediaUrls = (notifications: INotification[]): INotification[] => {
  return notifications.map(notification => transformNotificationMediaUrls(notification)).filter(Boolean) as INotification[];
};
