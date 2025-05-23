/**
 * Swagger schema for Message
 */
export const messageSchema = {
  MessageType: {
    type: "string",
    enum: ["text", "image", "video", "file", "audio", "system"],
    description: "Type of message content"
  },

  MessageStatus: {
    type: "string",
    enum: ["sent", "delivered", "read", "failed"],
    description: "Current status of the message"
  },

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
        oneOf: [
          {
            type: "string",
            description: "ID of the chat this message belongs to"
          },
          {
            $ref: "#/components/schemas/Chat",
            description: "Chat object this message belongs to"
          }
        ]
      },
      readBy: {
        type: "array",
        items: {
          $ref: "#/components/schemas/User"
        },
        description: "Array of users who have read this message",
      },
      messageType: {
        $ref: "#/components/schemas/MessageType",
        description: "Type of message content"
      },
      status: {
        $ref: "#/components/schemas/MessageStatus",
        description: "Current status of the message"
      },
      media: {
        type: "array",
        items: {
          type: "string"
        },
        description: "Array of media URLs associated with this message"
      },
      replyTo: {
        oneOf: [
          {
            type: "string",
            description: "ID of the message this is replying to"
          },
          {
            $ref: "#/components/schemas/Message",
            description: "Message object this is replying to"
          }
        ]
      },
      isDeleted: {
        type: "boolean",
        description: "Whether this message has been deleted"
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
      deletedAt: {
        type: "string",
        format: "date-time",
        description: "Timestamp when the message was deleted (if applicable)",
      },
    },
  },
};
