/**
 * Reusable schema components for Swagger documentation
 */
export const schemas = {
  // User related schemas
  RegisterUser: {
    type: "object",
    required: ["firstName", "lastName", "username", "email", "password"],
    properties: {
      firstName: { type: "string", example: "John" },
      lastName: { type: "string", example: "Doe" },
      username: { type: "string", example: "johndoe" },
      email: {
        type: "string",
        format: "email",
        example: "john@example.com",
      },
      password: { type: "string", example: "Password123!" },
    },
  },
  LoginUser: {
    type: "object",
    required: ["password"],
    properties: {
      email: {
        type: "string",
        format: "email",
        example: "john@example.com",
        description: "User's email (either email or username is required)",
      },
      username: {
        type: "string",
        example: "johndoe",
        description: "User's username (either email or username is required)",
      },
      password: { type: "string", example: "Password123!" },
    },
  },
  UpdateUser: {
    type: "object",
    properties: {
      firstName: { type: "string" },
      lastName: { type: "string" },
      username: { type: "string" },
      email: { type: "string", format: "email" },
      password: { type: "string" },
      bio: {
        type: "string",
        description: "User's bio (max 160 characters)",
        example: "Software developer | Coffee enthusiast | Travel lover"
      },
    },
  },
  UserProfile: {
    type: "object",
    properties: {
      id: { type: "string" },
      firstName: { type: "string" },
      lastName: { type: "string" },
      username: { type: "string" },
      email: { type: "string", format: "email" },
      profilePic: { type: "string" },
      coverPhoto: { type: "string" },
      bio: { type: "string" },
      following: { type: "array", items: { type: "string" } },
      followers: { type: "array", items: { type: "string" } },
    },
  },
  ResetPassword: {
    type: "object",
    required: ["oldPassword", "newPassword", "confirmPassword"],
    properties: {
      oldPassword: { type: "string", example: "OldPassword123!" },
      newPassword: { type: "string", example: "NewPassword123!" },
      confirmPassword: { type: "string", example: "NewPassword123!" },
    },
  },
  ForgotPassword: {
    type: "object",
    required: ["email"],
    properties: {
      email: { type: "string", format: "email", example: "john@example.com" },
    },
  },
  NewPassword: {
    type: "object",
    required: ["newPassword", "confirmPassword"],
    properties: {
      newPassword: { type: "string", example: "NewPassword123!" },
      confirmPassword: { type: "string", example: "NewPassword123!" },
    },
  },

  // Chat related schemas
  CreateChat: {
    type: "object",
    required: ["userId"],
    properties: {
      userId: { type: "string", example: "userId123" },
    },
  },
  CreateGroupChat: {
    type: "object",
    required: ["users", "chatName"],
    properties: {
      users: {
        type: "array",
        items: { type: "string" },
        example: ["userId1", "userId2"],
      },
      chatName: { type: "string", example: "Friends Group" },
    },
  },
  SendMessage: {
    type: "object",
    required: ["content"],
    properties: {
      content: { type: "string", example: "Hello, world!" },
    },
  },
  AddRemoveUserGroup: {
    type: "object",
    required: ["chatId", "userId"],
    properties: {
      chatId: { type: "string", example: "chatId123" },
      userId: { type: "string", example: "userId123" },
    },
  },
  UpdateGroupName: {
    type: "object",
    required: ["chatId", "chatName"],
    properties: {
      chatId: { type: "string", example: "chatId123" },
      chatName: { type: "string", example: "New Group Name" },
    },
  },
  ArchiveChat: {
    type: "object",
    required: ["chatId"],
    properties: {
      chatId: { type: "string", example: "chatId123" },
    },
  },

  // Message related schemas
  CreateMessage: {
    type: "object",
    required: ["content", "chatId"],
    properties: {
      content: {
        type: "string",
        example: "Hello message",
        description: "Content of the message"
      },
      chatId: {
        type: "string",
        example: "chatId123",
        description: "ID of the chat this message belongs to"
      },
      messageType: {
        type: "string",
        enum: ["text", "image", "video", "file", "audio", "system"],
        example: "text",
        description: "Type of message content (optional, defaults to text or determined from media)"
      },
      media: {
        type: "array",
        items: { type: "string" },
        example: ["url1.jpg", "url2.jpg"],
        description: "Array of media URLs (optional)"
      },
      replyToId: {
        type: "string",
        example: "messageId123",
        description: "ID of the message this is replying to (optional)"
      }
    },
  },
  EditMessage: {
    type: "object",
    properties: {
      content: {
        type: "string",
        example: "Updated message content",
        description: "Updated content of the message (optional if media is provided)"
      },
      chatId: {
        type: "string",
        example: "chatId123",
        description: "ID of the chat this message belongs to (required for socket events)"
      },
      media: {
        type: "array",
        items: { type: "string" },
        example: ["url1.jpg", "url2.jpg"],
        description: "Updated array of media URLs (optional)"
      }
    },
    required: ["chatId"]
  },

  // Post related schemas
  Post: {
    type: "object",
    properties: {
      content: {
        type: "string",
        example: "This is a post",
        description: "Post content text (optional if media is provided)"
      },
      media: {
        type: "array",
        items: { type: "string", format: "uri" },
        example: ["http://example.com/image.jpg"],
        description: "Array of media URLs or uploaded files"
      },
      visibility: {
        type: "string",
        enum: ["public", "private", "followers"],
        example: "public",
        description: "Post visibility setting"
      },
      replyTo: {
        type: "string",
        example: "64a1b2c3d4e5f6a7b8c9d0e1",
        description: "ID of the post this is a reply to"
      }
    },
  },

  // Pagination related schemas
  PostPagination: {
    type: "object",
    properties: {
      posts: {
        type: "array",
        items: { $ref: "#/components/schemas/Post" },
        description: "Array of posts"
      },
      pagination: {
        type: "object",
        properties: {
          next_max_id: {
            type: "string",
            example: "60d21b4667d0d8992e610c85",
            description: "ID to use as max_id in the next request to get older posts"
          },
          has_more: {
            type: "boolean",
            example: true,
            description: "Whether there are more posts to fetch"
          }
        }
      }
    }
  },

  UpdatePost: {
    type: "object",
    properties: {
      content: {
        type: "string",
        example: "This is an updated post",
        description: "Updated post content text (optional)"
      },
      media: {
        type: "array",
        items: { type: "string", format: "uri" },
        example: ["http://example.com/new-image.jpg"],
        description: "Updated array of media URLs (optional)"
      },
      visibility: {
        type: "string",
        enum: ["public", "private", "followers"],
        example: "private",
        description: "Updated post visibility setting (optional)"
      }
    },
  },

  // Notification related schemas
  Notification: {
    type: "object",
    properties: {
      id: { type: "string" },
      userTo: { type: "string" },
      userFrom: { type: "string" },
      notificationType: { type: "string" },
      opened: { type: "boolean" },
      createdAt: { type: "string", format: "date-time" },
    },
  },
};
