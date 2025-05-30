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
        {
          name: "max_id",
          in: "query",
          required: false,
          schema: { type: "string" },
          description: "Get posts older than this ID (cursor-based pagination)",
        },
        {
          name: "since_id",
          in: "query",
          required: false,
          schema: { type: "string" },
          description: "Get posts newer than this ID (cursor-based pagination)",
        },
        {
          name: "limit",
          in: "query",
          required: false,
          schema: { type: "integer", default: 10, minimum: 1, maximum: 100 },
          description: "Number of posts to return (default: 10, max: 100)",
        },
        {
          name: "includeComments",
          in: "query",
          required: false,
          schema: { type: "boolean", default: true },
          description: "Whether to include comments in the response (default: true)",
        },
      ],
      responses: {
        "200": {
          description: "List of posts with pagination metadata",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  status: { type: "string", example: "success" },
                  message: { type: "string", example: "Success" },
                  data: { $ref: "#/components/schemas/PostPagination" }
                }
              }
            }
          }
        },
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
          "multipart/form-data": {
            schema: {
              type: "object",
              properties: {
                content: {
                  type: "string",
                  description: "Post content text (optional if media is provided)",
                  example: "This is a post with an image"
                },
                media: {
                  type: "array",
                  items: {
                    type: "string",
                    format: "binary"
                  },
                  description: "Media files to upload (images/videos)"
                },
                replyTo: {
                  type: "string",
                  description: "ID of the post this is a reply to (for creating replies)",
                  example: "64a1b2c3d4e5f6a7b8c9d0e1"
                },
                visibility: {
                  type: "string",
                  enum: ["public", "private", "followers"],
                  default: "public",
                  description: "Post visibility setting"
                }
              }
            }
          },
          "application/json": {
            schema: { $ref: "#/components/schemas/Post" },
            example: {
              content: "This is a post",
              media: ["http://example.com/image.jpg"],
              visibility: "public",
              replyTo: "64a1b2c3d4e5f6a7b8c9d0e1" // Optional: ID of the post this is a reply to
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
        {
          name: "includeComments",
          in: "query",
          required: false,
          schema: { type: "boolean", default: true },
          description: "Whether to include comments in the response (default: true)",
        },
      ],
      responses: {
        "200": { description: "Post retrieved successfully" },
        "404": { description: "Post not found" },
      },
    },
    put: {
      tags: ["Post"],
      summary: "Update a post",
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: "id",
          in: "path",
          required: true,
          schema: { type: "string" },
          description: "ID of the post to update",
        },
      ],
      requestBody: {
        required: true,
        content: {
          "multipart/form-data": {
            schema: {
              type: "object",
              properties: {
                content: {
                  type: "string",
                  description: "Updated post content text (optional)",
                  example: "This is an updated post with a new image"
                },
                media: {
                  type: "array",
                  items: {
                    type: "string",
                    format: "binary"
                  },
                  description: "New media files to upload (optional)"
                },
                visibility: {
                  type: "string",
                  enum: ["public", "private", "followers"],
                  description: "Updated post visibility setting (optional)"
                }
              }
            }
          },
          "application/json": {
            schema: { $ref: "#/components/schemas/UpdatePost" },
            example: {
              content: "This is an updated post",
              media: ["http://example.com/new-image.jpg"],
              visibility: "private"
            },
          },
        },
      },
      responses: {
        "200": { description: "Post updated successfully" },
        "400": { description: "Bad request" },
        "404": { description: "Post not found or user doesn't have permission to update it" },
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
