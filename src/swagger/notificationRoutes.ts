/**
 * Swagger documentation for Notification routes
 */
export const notificationRoutes = {
  "/api/notification": {
    get: {
      tags: ["Notification"],
      summary: "Get notifications for the current user",
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: "unreadOnly",
          in: "query",
          required: false,
          schema: { type: "boolean" },
          description: "Filter for unread notifications only",
        },
      ],
      responses: {
        "200": { description: "List of notifications" },
        "500": { description: "Internal server error" },
      },
    },
  },
  "/api/notification/latest": {
    get: {
      tags: ["Notification"],
      summary: "Get latest notification for the current user",
      security: [{ bearerAuth: [] }],
      responses: {
        "200": { description: "Latest notification" },
        "404": { description: "No notifications found" },
      },
    },
  },
  "/api/notification/{id}": {
    get: {
      tags: ["Notification"],
      summary: "Get a specific notification by ID",
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: "id",
          in: "path",
          required: true,
          schema: { type: "string" },
          description: "ID of the notification to retrieve",
        },
      ],
      responses: {
        "200": { description: "Notification details" },
        "403": { description: "Unauthorized access" },
        "404": { description: "Notification not found" },
        "500": { description: "Internal server error" },
      },
    },
  },
  "/api/notification/{id}/markAsOpened": {
    put: {
      tags: ["Notification"],
      summary: "Mark a specific notification as opened",
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: "id",
          in: "path",
          required: true,
          schema: { type: "string" },
          description: "ID of the notification to mark as opened",
        },
      ],
      responses: {
        "204": { description: "Notification marked as opened" },
        "403": { description: "Unauthorized access" },
        "404": { description: "Notification not found" },
        "500": { description: "Internal server error" },
      },
    },
  },
  "/api/notification/markAsOpened": {
    put: {
      tags: ["Notification"],
      summary: "Mark all notifications as opened",
      security: [{ bearerAuth: [] }],
      responses: {
        "200": { description: "All notifications marked as opened" },
        "500": { description: "Internal server error" },
      },
    },
  },
};
