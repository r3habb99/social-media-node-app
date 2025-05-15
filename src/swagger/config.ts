import { SERVER_BASE_URL } from "../constants/urls";

/**
 * Base Swagger configuration
 */
export const swaggerConfig = {
  openapi: "3.0.0",
  info: {
    title: "Chat Node API",
    version: "1.0.0",
    description: "API documentation for Chat Node backend",
  },
  servers: [
    {
      url: `${SERVER_BASE_URL}/`,
      description: "Server",
    },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
      },
    },
  },
  security: [
    {
      bearerAuth: [],
    },
  ],
};
