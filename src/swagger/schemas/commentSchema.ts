/**
 * Swagger schema for Comment
 */
export const commentSchema = {
  Comment: {
    type: "object",
    properties: {
      id: {
        type: "string",
        description: "Unique identifier for the comment",
      },
      content: {
        type: "string",
        description: "Content of the comment",
      },
      postId: {
        type: "string",
        description: "ID of the post this comment belongs to",
      },
      author: {
        type: "object",
        properties: {
          id: { type: "string" },
          firstName: { type: "string" },
          lastName: { type: "string" },
          username: { type: "string" },
          profilePic: { type: "string" },
        },
      },
      likes: {
        type: "array",
        items: {
          type: "string",
        },
        description: "Array of user IDs who liked this comment",
      },
      replyTo: {
        type: "object",
        nullable: true,
        description: "Parent comment if this is a reply",
        properties: {
          id: { type: "string" },
          content: { type: "string" },
          author: {
            type: "object",
            properties: {
              id: { type: "string" },
              firstName: { type: "string" },
              lastName: { type: "string" },
              username: { type: "string" },
              profilePic: { type: "string" },
            },
          },
        },
      },
      createdAt: {
        type: "string",
        format: "date-time",
        description: "Timestamp when the comment was created",
      },
      updatedAt: {
        type: "string",
        format: "date-time",
        description: "Timestamp when the comment was last updated",
      },
    },
  },
};
