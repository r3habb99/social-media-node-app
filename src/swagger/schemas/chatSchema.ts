/**
 * Swagger schema for Chat
 */
export const chatSchema = {
  Chat: {
    type: "object",
    properties: {
      id: {
        type: "string",
        description: "Unique identifier for the chat",
      },
      chatName: {
        type: "string",
        description: "Name of the chat",
      },
      isGroupChat: {
        type: "boolean",
        description: "Whether this is a group chat",
      },
      users: {
        type: "array",
        items: {
          $ref: "#/components/schemas/User",
        },
        description: "Users in this chat",
      },
      latestMessage: {
        $ref: "#/components/schemas/Message",
        description: "Latest message in this chat",
      },
      createdAt: {
        type: "string",
        format: "date-time",
        description: "Timestamp when the chat was created",
      },
      updatedAt: {
        type: "string",
        format: "date-time",
        description: "Timestamp when the chat was last updated",
      },
    },
  },
};
