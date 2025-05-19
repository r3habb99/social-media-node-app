/**
 * Swagger schema for Notification
 */
export const notificationSchema = {
  Notification: {
    type: "object",
    properties: {
      id: {
        type: "string",
        description: "Unique identifier for the notification",
      },
      userTo: {
        $ref: "#/components/schemas/User",
        description: "User who received this notification",
      },
      userFrom: {
        $ref: "#/components/schemas/User",
        description: "User who triggered this notification",
      },
      notificationType: {
        type: "string",
        description: "Type of notification",
      },
      opened: {
        type: "boolean",
        description: "Whether the notification has been opened",
      },
      entityId: {
        type: "string",
        description: "ID of the entity this notification is about (post, comment, etc.)",
      },
      message: {
        type: "string",
        description: "Descriptive message about the notification (e.g., 'John has liked your post')",
      },
      createdAt: {
        type: "string",
        format: "date-time",
        description: "Timestamp when the notification was created",
      },
      updatedAt: {
        type: "string",
        format: "date-time",
        description: "Timestamp when the notification was last updated",
      },
    },
  },
};
