import { Server } from "http";
import mongoose from "mongoose";
import app from "./app";
import { v2 as cloudinary } from "cloudinary";
import config from "./config/index";

// Initialize server variable
let server: Server;

cloudinary.config({
  cloud_name: config.cloud_name,
  api_key: config.cloud_api_key,
  api_secret: config.cloud_secret_key,
  secure: true,
});
// Bootstrap function to connect to database and start server
async function bootstrap() {
  try {
    // Validate database URL
    if (!config.database_url) {
      throw new Error("DATABASE_URL is not defined in configuration");
    }

    // Connect to MongoDB
    await mongoose.connect(config.database_url);
    console.log("👋 Database connection successful");

    // Start server
    server = app.listen(config.port || 3000, () => {
      console.log(`🚀 Server running on port ${config.port || 3000}`);
    });
  } catch (error) {
    console.error("Failed to connect to database or start server:", error);
    process.exitCode = 1;
  }
}

// Handle uncaught exceptions
process.on("uncaughtException", (error) => {
  console.error("Uncaught Exception:", error);
  process.exitCode = 1;
});

// Handle unhandled promise rejections
process.on("unhandledRejection", async (error) => {
  console.error("Unhandled Rejection:", error);
  if (server) {
    await new Promise<void>((resolve) => server.close(() => resolve()));
    console.error("Server closed due to unhandled rejection");
    try {
      await mongoose.connection.close();
      console.log("Database connection closed");
    } catch (err) {
      console.error("Error closing database connection:", err);
    }
    process.exitCode = 1;
  } else {
    process.exitCode = 1;
  }
});

// Graceful shutdown on SIGTERM
process.on("SIGTERM", async () => {
  console.log("SIGTERM received, shutting down gracefully");
  if (server) {
    await new Promise<void>((resolve) => server.close(() => resolve()));
    console.log("Server closed");
    try {
      await mongoose.connection.close();
      console.log("Database connection closed");
    } catch (err) {
      console.error("Error closing database connection:", err);
    }
  }
  process.exitCode = 0;
});

// Start the application
bootstrap();
