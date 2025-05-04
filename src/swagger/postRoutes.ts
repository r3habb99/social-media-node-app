/**
 * Swagger documentation for Post routes
 */
export const postRoutes = {
  "/api/post": {
    get: {
      tags: ["Post"],
      summary: "Get all posts",
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: "isReply",
          in: "query",
          required: false,
          schema: { type: "string" },
          description: "Filter posts that are replies",
        },
        {
          name: "search",
          in: "query",
          required: false,
          schema: { type: "string" },
          description: "Search term for posts",
        },
      ],
      responses: {
        "200": { description: "List of posts" },
        "500": { description: "Internal server error" },
      },
    },
    post: {
      tags: ["Post"],
      summary: "Create a new post",
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/Post" },
            example: {
              content: "This is a post",
              media: ["http://example.com/image.jpg"],
              visibility: "public",
              isReply: false,
              search: "search term",
            },
          },
        },
      },
      responses: {
        "201": { description: "Post created successfully" },
        "400": { description: "Bad request" },
      },
    },
  },
  "/api/post/{id}": {
    get: {
      tags: ["Post"],
      summary: "Get post by ID",
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: "id",
          in: "path",
          required: true,
          schema: { type: "string" },
          description: "ID of the post to retrieve",
        },
      ],
      responses: {
        "200": { description: "Post retrieved successfully" },
        "404": { description: "Post not found" },
      },
    },
    delete: {
      tags: ["Post"],
      summary: "Delete a post",
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: "id",
          in: "path",
          required: true,
          schema: { type: "string" },
          description: "ID of the post to delete",
        },
      ],
      responses: {
        "200": { description: "Post deleted successfully" },
        "404": { description: "Post not found" },
      },
    },
  },
  "/api/post/{id}/like": {
    put: {
      tags: ["Post"],
      summary: "Like or unlike a post",
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: "id",
          in: "path",
          required: true,
          schema: { type: "string" },
          description: "ID of the post to like/unlike",
        },
      ],
      responses: {
        "200": { description: "Post liked/unliked successfully" },
        "404": { description: "Post not found" },
      },
    },
  },
  "/api/post/{id}/retweet": {
    post: {
      tags: ["Post"],
      summary: "Retweet or undo retweet of a post",
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: "id",
          in: "path",
          required: true,
          schema: { type: "string" },
          description: "ID of the post to retweet/undo retweet",
        },
      ],
      responses: {
        "200": { description: "Post retweeted/undo retweet successfully" },
        "404": { description: "Post not found" },
      },
    },
  },
};
