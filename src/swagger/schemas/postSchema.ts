/**
 * Swagger schema for Post
 */
export const postSchema = {
  Post: {
    type: "object",
    properties: {
      id: {
        type: "string",
        description: "Unique identifier for the post",
      },
      content: {
        type: "string",
        description: "Content of the post",
      },
      postedBy: {
        type: "object",
        properties: {
          id: { type: "string" },
          firstName: { type: "string" },
          lastName: { type: "string" },
          username: { type: "string" },
          profilePic: { type: "string" },
        },
      },
      pinned: {
        type: "boolean",
        description: "Whether the post is pinned to the user's profile",
      },
      likes: {
        type: "array",
        items: {
          type: "string",
        },
        description: "Array of user IDs who liked this post",
      },
      retweetUsers: {
        type: "array",
        items: {
          type: "string",
        },
        description: "Array of user IDs who retweeted this post",
      },
      retweetData: {
        type: "object",
        nullable: true,
        description: "Original post data if this is a retweet",
      },
      replyTo: {
        type: "object",
        nullable: true,
        description: "Original post data if this is a reply",
      },
      media: {
        type: "array",
        items: {
          type: "string",
        },
        description: "Array of media URLs attached to this post",
      },
      mediaType: {
        type: "string",
        enum: ["image", "video"],
        description: "Type of media attached to this post",
      },
      visibility: {
        type: "string",
        enum: ["public", "private", "followers"],
        description: "Visibility setting for this post",
      },
      commentCount: {
        type: "integer",
        description: "Number of comments on this post",
      },
      comments: {
        type: "array",
        items: {
          $ref: "#/components/schemas/Comment",
        },
        description: "Comments on this post (included when requested)",
      },
      commentsHasMore: {
        type: "boolean",
        description: "Whether there are more comments to fetch",
      },
      commentsTotal: {
        type: "integer",
        description: "Total number of comments on this post",
      },
      createdAt: {
        type: "string",
        format: "date-time",
        description: "Timestamp when the post was created",
      },
      updatedAt: {
        type: "string",
        format: "date-time",
        description: "Timestamp when the post was last updated",
      },
    },
  },
};
