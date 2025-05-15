import { startServer } from "./app";
import { logger } from "./services";

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error(`Uncaught Exception: ${error.message}`);
  if (error.stack) {
    logger.error(error.stack);
  }
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  logger.error(`Unhandled Rejection at: ${promise}, reason: ${reason}`);
  process.exit(1);
});

// Start the server
(async () => {
  try {
    await startServer();
  } catch (error) {
    if (error instanceof Error) {
      logger.error(`Failed to start server: ${error.message}`);
      if (error.stack) {
        logger.error(error.stack);
      }
    } else {
      logger.error(`Failed to start server with unknown error: ${error}`);
    }
    process.exit(1);
  }
})();
