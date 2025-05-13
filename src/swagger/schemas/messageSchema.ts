/**
 * Swagger schema for Message
 */
export const messageSchema = {
  Message: {
    type: "object",
    properties: {
      id: {
        type: "string",
        description: "Unique identifier for the message",
      },
      sender: {
        $ref: "#/components/schemas/User",
        description: "User who sent this message",
      },
      content: {
        type: "string",
        description: "Content of the message",
      },
      chat: {
        type: "string",
        description: "ID of the chat this message belongs to",
      },
      readBy: {
        type: "array",
        items: {
          type: "string",
        },
        description: "Array of user IDs who have read this message",
      },
      createdAt: {
        type: "string",
        format: "date-time",
        description: "Timestamp when the message was created",
      },
      updatedAt: {
        type: "string",
        format: "date-time",
        description: "Timestamp when the message was last updated",
      },
    },
  },
};
