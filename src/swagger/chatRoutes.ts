/**
 * Swagger documentation for Chat routes
 */
export const chatRoutes = {
  "/api/chat": {
    post: {
      tags: ["Chat"],
      summary: "Create a new individual chat",
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/CreateChat" },
            example: { userId: "userId123" },
          },
        },
      },
      responses: {
        "201": { description: "Chat created successfully" },
        "400": { description: "Bad request" },
      },
    },
    get: {
      tags: ["Chat"],
      summary: "Get all chats for the logged-in user",
      security: [{ bearerAuth: [] }],
      responses: {
        "200": { description: "List of chats" },
        "204": { description: "No chats found" },
      },
    },
  },
  "/api/chat/group": {
    post: {
      tags: ["Chat"],
      summary: "Create a group chat",
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/CreateGroupChat" },
            example: {
              users: ["userId1", "userId2"],
              chatName: "Friends Group",
            },
          },
        },
      },
      responses: {
        "201": { description: "Group chat created successfully" },
        "400": { description: "Bad request" },
      },
    },
  },
  "/api/chat/{chatId}/messages": {
    get: {
      tags: ["Chat"],
      summary: "Get messages for a specific chat",
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: "chatId",
          in: "path",
          required: true,
          schema: { type: "string" },
          description: "ID of the chat to get messages for",
        },
      ],
      responses: {
        "200": { description: "List of messages" },
        "404": { description: "Chat not found" },
      },
    },
  },
  "/api/chat/{chatId}/message": {
    post: {
      tags: ["Chat"],
      summary: "Send a message in a chat",
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: "chatId",
          in: "path",
          required: true,
          schema: { type: "string" },
          description: "ID of the chat to send message in",
        },
      ],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/SendMessage" },
            example: { content: "Hello, world!" },
          },
        },
      },
      responses: {
        "201": { description: "Message sent successfully" },
        "400": { description: "Bad request" },
      },
    },
  },
  "/api/chat/group/add-user": {
    put: {
      tags: ["Chat"],
      summary: "Add a user to a group chat",
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/AddRemoveUserGroup" },
            example: {
              chatId: "chatId123",
              userId: "userId123",
            },
          },
        },
      },
      responses: {
        "200": { description: "User added to group successfully" },
        "400": { description: "Bad request" },
        "404": { description: "Chat or user not found" },
      },
    },
  },
  "/api/chat/group/remove-user": {
    put: {
      tags: ["Chat"],
      summary: "Remove a user from a group chat",
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/AddRemoveUserGroup" },
            example: {
              chatId: "chatId123",
              userId: "userId123",
            },
          },
        },
      },
      responses: {
        "200": { description: "User removed from group successfully" },
        "400": { description: "Bad request" },
        "404": { description: "Chat or user not found" },
      },
    },
  },
  "/api/chat/group/update-name": {
    put: {
      tags: ["Chat"],
      summary: "Update group chat name",
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/UpdateGroupName" },
            example: {
              chatId: "chatId123",
              chatName: "New Group Name",
            },
          },
        },
      },
      responses: {
        "200": { description: "Group name updated successfully" },
        "400": { description: "Bad request" },
        "404": { description: "Chat not found" },
      },
    },
  },
  "/api/chat/archive": {
    put: {
      tags: ["Chat"],
      summary: "Archive a chat",
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/ArchiveChat" },
            example: {
              chatId: "chatId123",
            },
          },
        },
      },
      responses: {
        "200": { description: "Chat archived successfully" },
        "400": { description: "Bad request" },
        "404": { description: "Chat not found" },
      },
    },
  },
  "/api/chat/unread": {
    get: {
      tags: ["Chat"],
      summary: "Get unread message counts for all chats",
      security: [{ bearerAuth: [] }],
      responses: {
        "200": { description: "Unread message counts retrieved successfully" },
        "500": { description: "Internal server error" },
      },
    },
  },
};
