/**
 * Swagger schema for User
 */
export const userSchema = {
  User: {
    type: "object",
    properties: {
      id: {
        type: "string",
        description: "Unique identifier for the user",
      },
      firstName: {
        type: "string",
        description: "User's first name",
      },
      lastName: {
        type: "string",
        description: "User's last name",
      },
      username: {
        type: "string",
        description: "User's username",
      },
      email: {
        type: "string",
        format: "email",
        description: "User's email address",
      },
      profilePic: {
        type: "string",
        description: "URL to user's profile picture",
      },
      coverPhoto: {
        type: "string",
        description: "URL to user's cover photo",
      },
      bio: {
        type: "string",
        description: "User's bio (limited to 160 characters)",
      },
      following: {
        type: "array",
        items: {
          type: "string",
        },
        description: "Array of user IDs that this user follows",
      },
      followers: {
        type: "array",
        items: {
          type: "string",
        },
        description: "Array of user IDs that follow this user",
      },
      createdAt: {
        type: "string",
        format: "date-time",
        description: "Timestamp when the user was created",
      },
      updatedAt: {
        type: "string",
        format: "date-time",
        description: "Timestamp when the user was last updated",
      },
    },
  },
};
