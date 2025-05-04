/**
 * Swagger documentation for User routes
 */
export const userRoutes = {
  "/api/user/register": {
    post: {
      tags: ["User"],
      summary: "Register a new user",
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/RegisterUser" },
            example: {
              firstName: "John",
              lastName: "Doe",
              username: "johndoe",
              email: "john@example.com",
              password: "Password123!",
            },
          },
        },
      },
      responses: {
        "201": { description: "User created successfully" },
        "400": { description: "Bad request" },
      },
    },
  },
  "/api/user/login": {
    post: {
      tags: ["User"],
      summary: "Login a user",
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/LoginUser" },
            example: {
              email: "john@example.com",
              password: "Password123!",
            },
          },
        },
      },
      responses: {
        "200": { description: "Login successful" },
        "400": { description: "Invalid credentials" },
      },
    },
  },
  "/api/user/logout": {
    delete: {
      tags: ["User"],
      summary: "Logout a user",
      security: [{ bearerAuth: [] }],
      responses: {
        "200": { description: "Logout successful" },
        "401": { description: "Unauthorized" },
      },
    },
  },
  "/api/user/update": {
    put: {
      tags: ["User"],
      summary: "Update user profile",
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/UpdateUser" },
            example: {
              firstName: "Updated",
              lastName: "Name",
              username: "updatedusername",
            },
          },
        },
      },
      responses: {
        "200": { description: "User updated successfully" },
        "400": { description: "Bad request" },
        "404": { description: "User not found" },
      },
    },
  },
  "/api/user": {
    get: {
      tags: ["User"],
      summary: "Get current user information",
      security: [{ bearerAuth: [] }],
      responses: {
        "200": { description: "User information retrieved successfully" },
        "401": { description: "Unauthorized" },
      },
    },
  },
  "/api/user/search": {
    get: {
      tags: ["User"],
      summary: "Search for users",
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: "username",
          in: "query",
          required: false,
          schema: { type: "string" },
          description: "Username to search for",
        },
        {
          name: "firstName",
          in: "query",
          required: false,
          schema: { type: "string" },
          description: "First name to search for",
        },
        {
          name: "lastName",
          in: "query",
          required: false,
          schema: { type: "string" },
          description: "Last name to search for",
        },
        {
          name: "email",
          in: "query",
          required: false,
          schema: { type: "string" },
          description: "Email to search for",
        },
      ],
      responses: {
        "200": { description: "Search results" },
        "400": { description: "Bad request" },
      },
    },
  },
  "/api/user/upload/profile-picture": {
    post: {
      tags: ["User"],
      summary: "Upload profile picture",
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          "multipart/form-data": {
            schema: {
              type: "object",
              properties: {
                image: {
                  type: "string",
                  format: "binary",
                  description: "Profile picture image file",
                },
              },
            },
          },
        },
      },
      responses: {
        "200": { description: "Profile picture uploaded successfully" },
        "400": { description: "Bad request" },
      },
    },
  },
  "/api/user/upload/cover-photo": {
    post: {
      tags: ["User"],
      summary: "Upload cover photo",
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          "multipart/form-data": {
            schema: {
              type: "object",
              properties: {
                image: {
                  type: "string",
                  format: "binary",
                  description: "Cover photo image file",
                },
              },
            },
          },
        },
      },
      responses: {
        "200": { description: "Cover photo uploaded successfully" },
        "400": { description: "Bad request" },
      },
    },
  },
  "/api/user/profile": {
    get: {
      tags: ["User"],
      summary: "Get user profile",
      security: [{ bearerAuth: [] }],
      responses: {
        "200": { description: "User profile retrieved successfully" },
        "401": { description: "Unauthorized" },
      },
    },
  },
  "/api/user/{userId}": {
    get: {
      tags: ["User"],
      summary: "Get user by ID",
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: "userId",
          in: "path",
          required: true,
          schema: { type: "string" },
          description: "ID of the user to retrieve",
        },
      ],
      responses: {
        "200": { description: "User retrieved successfully" },
        "404": { description: "User not found" },
      },
    },
  },
  "/api/user/{userId}/follow": {
    put: {
      tags: ["User"],
      summary: "Follow or unfollow a user",
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: "userId",
          in: "path",
          required: true,
          schema: { type: "string" },
          description: "ID of the user to follow/unfollow",
        },
      ],
      responses: {
        "200": { description: "Follow/unfollow action successful" },
        "404": { description: "User not found" },
      },
    },
  },
  "/api/user/{userId}/following": {
    get: {
      tags: ["User"],
      summary: "Get users that a user is following",
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: "userId",
          in: "path",
          required: true,
          schema: { type: "string" },
          description: "ID of the user",
        },
      ],
      responses: {
        "200": { description: "Following list retrieved successfully" },
        "404": { description: "User not found" },
      },
    },
  },
  "/api/user/{userId}/followers": {
    get: {
      tags: ["User"],
      summary: "Get followers of a user",
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: "userId",
          in: "path",
          required: true,
          schema: { type: "string" },
          description: "ID of the user",
        },
      ],
      responses: {
        "200": { description: "Followers list retrieved successfully" },
        "404": { description: "User not found" },
      },
    },
  },
  "/api/user/reset-password": {
    put: {
      tags: ["User"],
      summary: "Reset user password",
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/ResetPassword" },
          },
        },
      },
      responses: {
        "200": { description: "Password reset successfully" },
        "400": { description: "Bad request" },
      },
    },
  },
  "/api/user/forgot-password": {
    post: {
      tags: ["User"],
      summary: "Request password reset link",
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/ForgotPassword" },
          },
        },
      },
      responses: {
        "200": { description: "Password reset link sent" },
        "404": { description: "User not found" },
      },
    },
  },
  "/api/user/reset/{token}": {
    post: {
      tags: ["User"],
      summary: "Submit new password with reset token",
      parameters: [
        {
          name: "token",
          in: "path",
          required: true,
          schema: { type: "string" },
          description: "Password reset token",
        },
      ],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/NewPassword" },
          },
        },
      },
      responses: {
        "200": { description: "Password updated successfully" },
        "400": { description: "Bad request" },
        "404": { description: "Invalid or expired token" },
      },
    },
  },
};
