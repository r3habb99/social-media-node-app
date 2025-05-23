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
              messageType: "text",
              media: [],
              replyToId: null
            },
          },
        },
      },
      responses: {
        "201": {
          description: "Message created successfully",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/Message" }
            }
          }
        },
        "400": { description: "Bad request" },
      },
    },
  },
  "/api/message/chat": {
    get: {
      tags: ["Message"],
      summary: "Get messages for a chat",
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: "chatId",
          in: "query",
          required: true,
          schema: { type: "string" },
          description: "ID of the chat to retrieve messages from",
        },
        {
          name: "limit",
          in: "query",
          required: false,
          schema: { type: "integer", default: 20 },
          description: "Number of messages to retrieve",
        },
        {
          name: "skip",
          in: "query",
          required: false,
          schema: { type: "integer", default: 0 },
          description: "Number of messages to skip",
        },
      ],
      responses: {
        "200": {
          description: "Messages retrieved successfully",
          content: {
            "application/json": {
              schema: {
                type: "array",
                items: { $ref: "#/components/schemas/Message" }
              }
            }
          }
        },
        "400": { description: "Bad request" },
      },
    },
  },
  "/api/message/{messageId}": {
    get: {
      tags: ["Message"],
      summary: "Get a single message by ID",
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: "messageId",
          in: "path",
          required: true,
          schema: { type: "string" },
          description: "ID of the message to retrieve",
        },
      ],
      responses: {
        "200": {
          description: "Message retrieved successfully",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/Message" }
            }
          }
        },
        "404": { description: "Message not found" },
      },
    },
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
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              required: ["chatId"],
              properties: {
                chatId: {
                  type: "string",
                  description: "ID of the chat the message belongs to"
                }
              }
            },
            example: {
              chatId: "chatId123"
            }
          }
        }
      },
      responses: {
        "200": {
          description: "Message deleted successfully",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/Message" }
            }
          }
        },
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
              chatId: "chatId123",
              media: ["url1.jpg", "url2.jpg"]
            },
          },
        },
      },
      responses: {
        "200": {
          description: "Message updated successfully",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/Message" }
            }
          }
        },
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
        "200": {
          description: "Search results",
          content: {
            "application/json": {
              schema: {
                type: "array",
                items: { $ref: "#/components/schemas/Message" }
              }
            }
          }
        },
        "400": { description: "Bad request" },
      },
    },
  },
};
