import { Server as HTTPServer } from "http";
import { Server, Socket } from "socket.io";
import mongoose from "mongoose";
import { IMessage } from "./interfaces";
import { logger } from "./services";
import { saveMessage } from "./queries";
import { verifyToken } from "./services/jwtHelper";
import { JWT_SECRET } from "./config";

interface IUserSocket extends Socket {
  userId?: string;
}

export const initializeSocket = (httpServer: HTTPServer): Server => {
  const io = new Server(httpServer, {
    cors: {
      origin: [
        "http://192.168.0.88:3000",
        "http://192.168.1.9:3000",
        "http://localhost:3000",
        "http://localhost:8080",
      ], // Allowed frontend origins
      methods: ["GET", "POST"],
      allowedHeaders: ["Content-Type", "Authorization"],
      credentials: true,
    },
  });

  // Map to track online users and their socket IDs
  const onlineUsers = new Map<string, string>();

  io.use((socket: IUserSocket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) {
      logger.error("Socket connection rejected: No token provided");
      return next(new Error("Authentication error: No token provided"));
    }
    try {
      if (!JWT_SECRET) {
        throw new Error("JWT_SECRET is not defined");
      }
      const decoded = verifyToken(token, JWT_SECRET);
      if (!decoded) {
        logger.error("Socket connection rejected: Invalid token");
        return next(new Error("Authentication error: Invalid token"));
      }
      socket.userId = decoded.id;
      next();
    } catch (err) {
      logger.error("Socket connection rejected:", err);
      return next(new Error("Authentication error"));
    }
  });

  io.on("connection", (socket: IUserSocket) => {
    if (!socket.userId) {
      logger.error("Socket connected without userId");
      socket.disconnect();
      return;
    }
    logger.info(`🔌 User connected: ${socket.userId} (socket id: ${socket.id})`);

    // Add user to online users map
    onlineUsers.set(socket.userId, socket.id);

    // Notify others that user is online
    socket.broadcast.emit("user online", socket.userId);

    // Automatically join personal room without waiting for 'setup' event
    socket.join(socket.userId);
    logger.info(`✅ User ${socket.userId} joined personal room automatically`);
    socket.emit("setup complete", socket.userId);

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

    // Handle typing indicator
    socket.on("typing", (roomId) => {
      socket.to(roomId).emit("typing", socket.userId);
    });

    socket.on("stop typing", (roomId) => {
      socket.to(roomId).emit("stop typing", socket.userId);
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
      logger.info(`🔴 User disconnected: ${socket.userId} (socket id: ${socket.id}), Reason: ${reason}`);

      // Remove user from online users map
      if (socket.userId) {
        onlineUsers.delete(socket.userId);
        // Notify others that user is offline
        socket.broadcast.emit("user offline", socket.userId);
      }
    });
  });

  return io;
};
