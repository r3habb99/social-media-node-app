import { Server as HTTPServer } from "http";
import { Server, Socket } from "socket.io";
import mongoose from "mongoose";
import { IMessage } from "./interfaces";
import { logger } from "./services";
import { saveMessage } from "./queries";

export const initializeSocket = (httpServer: HTTPServer): Server => {
  const io = new Server(httpServer, {
    cors: {
      // origin: ["http://localhost:3000"],
      origin: [
        "http://192.168.0.88:3000",
        "http://192.168.1.9:3000",
        "http://localhost:3000",
      ], // Allowed frontend origins
      methods: ["GET", "POST"],
      allowedHeaders: ["Content-Type", "Authorization"],
      credentials: true,
    },
  });

  io.on("connection", (socket: Socket) => {
    logger.info(`🔌 A user connected: ${socket.id}`);

    // Handle user setup
    socket.on("setup", (userData) => {
      logger.info(`📡 Received 'setup' event: ${JSON.stringify(userData)}`);
      if (!userData || !userData._id) {
        logger.error("❌ Invalid userData received");
        return;
      }
      socket.join(userData._id);
      logger.info(`✅ User ${userData._id} joined personal room`);
      socket.emit("setup complete", userData._id);
    });

    // Handle joining a chat room
    socket.on("join room", async (roomId) => {
      logger.info(`📥 'join room' event received for room: ${roomId}`);
      if (!roomId) {
        logger.error("❌ Invalid roomId received");
        return;
      }

      socket.join(roomId);
      logger.info(`🏠 User joined chat room: ${roomId}`);

      // Debug: Log all users in the room
      const sockets = await io.in(roomId).fetchSockets();
      logger.info(
        `👥 Users in room ${roomId}: ${sockets.map((s) => s.id).join(", ")}`
      );

      socket.emit("joined room", roomId);
    });

    // Handle sending a new message
    socket.on("new message", async (newMessage: IMessage) => {
      logger.info(
        `💬 'new message' event received: ${JSON.stringify(newMessage)}`
      );

      if (
        !newMessage ||
        !newMessage.chat ||
        !newMessage.chat._id ||
        !newMessage.sender ||
        !newMessage.content
      ) {
        logger.error("❌ Invalid message format received");
        return;
      }

      try {
        // Save message to database
        const savedMessage = await saveMessage(
          new mongoose.Types.ObjectId(newMessage.sender),
          newMessage.content,
          new mongoose.Types.ObjectId(newMessage.chat._id)
        );

        logger.info(`✅ Message saved to DB`);

        // Broadcast message to all users in the room
        const chatRoom = newMessage.chat._id.toString();
        io.to(chatRoom).emit("message received", savedMessage);
        logger.info(`📨 Message broadcasted to room: ${chatRoom}`);
      } catch (error) {
        logger.error(`❌ Error saving message to DB: ${error}`);
      }
    });

    // Handle disconnection
    socket.on("disconnect", (reason) => {
      logger.info(`🔴 User disconnected: ${socket.id}, Reason: ${reason}`);
    });
  });

  return io;
};
