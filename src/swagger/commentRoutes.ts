/**
 * Swagger documentation for Comment routes
 */
export const commentRoutes = {
  "/api/comment": {
    post: {
      tags: ["Comment"],
      summary: "Create a new comment on a post",
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              required: ["postId", "content"],
              properties: {
                postId: {
                  type: "string",
                  description: "ID of the post to comment on",
                },
                content: {
                  type: "string",
                  description: "Content of the comment",
                },
                replyToId: {
                  type: "string",
                  description: "ID of the comment to reply to (optional)",
                },
              },
            },
          },
        },
      },
      responses: {
        201: {
          description: "Comment created successfully",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  status: { type: "number" },
                  message: { type: "string" },
                  data: {
                    type: "object",
                    properties: {
                      id: { type: "string" },
                      content: { type: "string" },
                      postId: { type: "string" },
                      author: {
                        type: "object",
                        properties: {
                          id: { type: "string" },
                          firstName: { type: "string" },
                          lastName: { type: "string" },
                          username: { type: "string" },
                          profilePic: { type: "string" }
                        }
                      },
                      likes: {
                        type: "array",
                        items: { type: "string" }
                      },
                      createdAt: { type: "string", format: "date-time" },
                      updatedAt: { type: "string", format: "date-time" }
                    }
                  },
                },
              },
            },
          },
        },
        400: { description: "Bad request" },
        401: { description: "Unauthorized" },
        500: { description: "Internal server error" },
      },
    },
  },
  "/api/comment/post/{postId}": {
    get: {
      tags: ["Comment"],
      summary: "Get comments for a post",
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: "postId",
          in: "path",
          required: true,
          schema: { type: "string" },
          description: "ID of the post to get comments for",
        },
        {
          name: "page",
          in: "query",
          required: false,
          schema: { type: "integer", default: 1 },
          description: "Page number for pagination",
        },
        {
          name: "limit",
          in: "query",
          required: false,
          schema: { type: "integer", default: 10 },
          description: "Number of comments per page",
        },
        {
          name: "parentOnly",
          in: "query",
          required: false,
          schema: { type: "boolean", default: true },
          description: "Whether to return only parent comments (not replies)",
        },
      ],
      responses: {
        200: {
          description: "Comments retrieved successfully",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  status: { type: "number" },
                  message: { type: "string" },
                  data: {
                    type: "object",
                    properties: {
                      comments: {
                        type: "array",
                        items: {
                          type: "object",
                          properties: {
                            id: { type: "string" },
                            content: { type: "string" },
                            postId: { type: "string" },
                            author: {
                              type: "object",
                              properties: {
                                id: { type: "string" },
                                firstName: { type: "string" },
                                lastName: { type: "string" },
                                username: { type: "string" },
                                profilePic: { type: "string" }
                              }
                            },
                            likes: {
                              type: "array",
                              items: { type: "string" }
                            },
                            createdAt: { type: "string", format: "date-time" },
                            updatedAt: { type: "string", format: "date-time" }
                          }
                        },
                      },
                      pagination: {
                        type: "object",
                        properties: {
                          total: { type: "number" },
                          page: { type: "number" },
                          limit: { type: "number" },
                          hasMore: { type: "boolean" },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
        400: { description: "Bad request" },
        401: { description: "Unauthorized" },
        500: { description: "Internal server error" },
      },
    },
  },
  "/api/comment/replies/{commentId}": {
    get: {
      tags: ["Comment"],
      summary: "Get replies for a comment",
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: "commentId",
          in: "path",
          required: true,
          schema: { type: "string" },
          description: "ID of the comment to get replies for",
        },
        {
          name: "page",
          in: "query",
          required: false,
          schema: { type: "integer", default: 1 },
          description: "Page number for pagination",
        },
        {
          name: "limit",
          in: "query",
          required: false,
          schema: { type: "integer", default: 10 },
          description: "Number of replies per page",
        },
      ],
      responses: {
        200: {
          description: "Replies retrieved successfully",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  status: { type: "number" },
                  message: { type: "string" },
                  data: {
                    type: "object",
                    properties: {
                      replies: {
                        type: "array",
                        items: {
                          type: "object",
                          properties: {
                            id: { type: "string" },
                            content: { type: "string" },
                            postId: { type: "string" },
                            author: {
                              type: "object",
                              properties: {
                                id: { type: "string" },
                                firstName: { type: "string" },
                                lastName: { type: "string" },
                                username: { type: "string" },
                                profilePic: { type: "string" }
                              }
                            },
                            likes: {
                              type: "array",
                              items: { type: "string" }
                            },
                            createdAt: { type: "string", format: "date-time" },
                            updatedAt: { type: "string", format: "date-time" }
                          }
                        },
                      },
                      pagination: {
                        type: "object",
                        properties: {
                          total: { type: "number" },
                          page: { type: "number" },
                          limit: { type: "number" },
                          hasMore: { type: "boolean" },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
        400: { description: "Bad request" },
        401: { description: "Unauthorized" },
        500: { description: "Internal server error" },
      },
    },
  },
  "/api/comment/{commentId}": {
    put: {
      tags: ["Comment"],
      summary: "Update a comment",
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: "commentId",
          in: "path",
          required: true,
          schema: { type: "string" },
          description: "ID of the comment to update",
        },
      ],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              required: ["content"],
              properties: {
                content: {
                  type: "string",
                  description: "New content of the comment",
                },
              },
            },
          },
        },
      },
      responses: {
        200: {
          description: "Comment updated successfully",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  status: { type: "number" },
                  message: { type: "string" },
                  data: {
                    type: "object",
                    properties: {
                      id: { type: "string" },
                      content: { type: "string" },
                      postId: { type: "string" },
                      author: {
                        type: "object",
                        properties: {
                          id: { type: "string" },
                          firstName: { type: "string" },
                          lastName: { type: "string" },
                          username: { type: "string" },
                          profilePic: { type: "string" }
                        }
                      },
                      likes: {
                        type: "array",
                        items: { type: "string" }
                      },
                      createdAt: { type: "string", format: "date-time" },
                      updatedAt: { type: "string", format: "date-time" }
                    }
                  },
                },
              },
            },
          },
        },
        400: { description: "Bad request" },
        401: { description: "Unauthorized" },
        404: { description: "Comment not found or user does not have permission to update" },
        500: { description: "Internal server error" },
      },
    },
    delete: {
      tags: ["Comment"],
      summary: "Delete a comment",
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: "commentId",
          in: "path",
          required: true,
          schema: { type: "string" },
          description: "ID of the comment to delete",
        },
      ],
      responses: {
        200: {
          description: "Comment deleted successfully",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  status: { type: "number" },
                  message: { type: "string" },
                  data: {
                    type: "object",
                    properties: {
                      deleted: { type: "boolean" },
                    },
                  },
                },
              },
            },
          },
        },
        401: { description: "Unauthorized" },
        404: { description: "Comment not found or user does not have permission to delete" },
        500: { description: "Internal server error" },
      },
    },
  },
  "/api/comment/{commentId}/like": {
    put: {
      tags: ["Comment"],
      summary: "Like or unlike a comment",
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: "commentId",
          in: "path",
          required: true,
          schema: { type: "string" },
          description: "ID of the comment to like/unlike",
        },
      ],
      responses: {
        200: {
          description: "Comment like toggled successfully",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  status: { type: "number" },
                  message: { type: "string" },
                  data: {
                    type: "object",
                    properties: {
                      id: { type: "string" },
                      content: { type: "string" },
                      postId: { type: "string" },
                      author: {
                        type: "object",
                        properties: {
                          id: { type: "string" },
                          firstName: { type: "string" },
                          lastName: { type: "string" },
                          username: { type: "string" },
                          profilePic: { type: "string" }
                        }
                      },
                      likes: {
                        type: "array",
                        items: { type: "string" }
                      },
                      createdAt: { type: "string", format: "date-time" },
                      updatedAt: { type: "string", format: "date-time" }
                    }
                  },
                },
              },
            },
          },
        },
        401: { description: "Unauthorized" },
        404: { description: "Comment not found" },
        500: { description: "Internal server error" },
      },
    },
  },
};
