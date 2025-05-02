// src/server.js
import { config } from "dotenv";
import app from "./app.js";
import connectDb from "./config/db.js";
import { logger } from "./config/logger.js";

// Load environment variables from .env file
config();

// Handle uncaught exceptions
process.on("uncaughtException", (err) => {
  logger.error("UNCAUGHT EXCEPTION! 💥 Shutting down...");
  logger.error(`${err.name}: ${err.message}`);
  logger.error(err.stack);
  process.exit(1);
});

// Server configuration
const port = process.env.PORT || 3000;
const environment = process.env.NODE_ENV || "development";

// Start server
const startServer = async () => {
  try {
    // Connect to MongoDB
    await connectDb();

    // Start Express server
    const server = app.listen(port, () => {
      logger.info(`Server running in ${environment} mode on port ${port}`);
    });

    // Handle unhandled promise rejections
    process.on("unhandledRejection", (err) => {
      logger.error("UNHANDLED REJECTION! 💥 Shutting down...");
      logger.error(`${err.name}: ${err.message}`);
      logger.error(err.stack);

      // Gracefully close server before exiting
      server.close(() => {
        process.exit(1);
      });
    });

    // Handle SIGTERM signal
    process.on("SIGTERM", () => {
      logger.info("👋 SIGTERM RECEIVED. Shutting down gracefully");
      server.close(() => {
        logger.info("💥 Process terminated!");
      });
    });

    return server;
  } catch (error) {
    logger.error(`Failed to start server: ${error.message}`);
    process.exit(1);
  }
};

// Initialize server
startServer();
