/**
 * Swagger documentation for Message routes
 */
export const messageRoutes = {
  "/api/message": {
    post: {
      tags: ["Message"],
      summary: "Create a new message",
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/CreateMessage" },
            example: {
              content: "Hello message",
              chatId: "chatId123",
            },
          },
        },
      },
      responses: {
        "201": { description: "Message created successfully" },
        "400": { description: "Bad request" },
      },
    },
  },
  "/api/message/id": {
    get: {
      tags: ["Message"],
      summary: "Get message by ID",
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: "messageId",
          in: "query",
          required: true,
          schema: { type: "string" },
          description: "ID of the message to retrieve",
        },
      ],
      responses: {
        "200": { description: "Message retrieved successfully" },
        "404": { description: "Message not found" },
      },
    },
  },
  "/api/message/{messageId}": {
    delete: {
      tags: ["Message"],
      summary: "Delete a message",
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: "messageId",
          in: "path",
          required: true,
          schema: { type: "string" },
          description: "ID of the message to delete",
        },
      ],
      responses: {
        "200": { description: "Message deleted successfully" },
        "404": { description: "Message not found" },
      },
    },
    put: {
      tags: ["Message"],
      summary: "Edit a message",
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: "messageId",
          in: "path",
          required: true,
          schema: { type: "string" },
          description: "ID of the message to edit",
        },
      ],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/EditMessage" },
            example: {
              content: "Updated message content",
            },
          },
        },
      },
      responses: {
        "200": { description: "Message updated successfully" },
        "400": { description: "Bad request" },
        "404": { description: "Message not found" },
      },
    },
  },
  "/api/message/search": {
    get: {
      tags: ["Message"],
      summary: "Search messages",
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: "chatId",
          in: "query",
          required: true,
          schema: { type: "string" },
          description: "ID of the chat to search messages in",
        },
        {
          name: "query",
          in: "query",
          required: true,
          schema: { type: "string" },
          description: "Search query string",
        },
      ],
      responses: {
        "200": { description: "Search results" },
        "400": { description: "Bad request" },
      },
    },
  },
};
