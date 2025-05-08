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
    required: ["email", "password"],
    properties: {
      email: {
        type: "string",
        format: "email",
        example: "john@example.com",
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
      content: { type: "string", example: "Hello message" },
      chatId: { type: "string", example: "chatId123" },
    },
  },
  EditMessage: {
    type: "object",
    required: ["content"],
    properties: {
      content: { type: "string", example: "Updated message content" },
    },
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
      isReply: {
        type: "boolean",
        example: false,
        description: "Whether this post is a reply to another post"
      }
    },
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
