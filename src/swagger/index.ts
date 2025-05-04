import { Express } from "express";
import swaggerUi from "swagger-ui-express";
import { swaggerConfig } from "./config";
import { schemas } from "./schemas";
import { userRoutes } from "./userRoutes";
import { chatRoutes } from "./chatRoutes";
import { messageRoutes } from "./messageRoutes";
import { postRoutes } from "./postRoutes";
import { notificationRoutes } from "./notificationRoutes";

// Combine all routes
const paths = {
  ...userRoutes,
  ...chatRoutes,
  ...messageRoutes,
  ...postRoutes,
  ...notificationRoutes,
};

// Create the complete Swagger specification
const swaggerSpec = {
  ...swaggerConfig,
  components: {
    ...swaggerConfig.components,
    schemas,
  },
  paths,
};

/**
 * Set up Swagger documentation for the Express app
 * @param app Express application
 */
export function setupSwagger(app: Express) {
  app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
}
