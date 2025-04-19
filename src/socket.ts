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
        "http://localhost:8080",
      ], // Allowed frontend origins
      methods: ["GET", "POST"],
      allowedHeaders: ["Content-Type", "Authorization"],
      credentials: true,
    },
  });

  io.on("connection", (socket: Socket) => {
    logger.info(`🔌 A user connected: ${socket.id}`);

    // Join a chat room
    socket.on("join room", (roomId) => {
      socket.join(roomId);
      logger.info(`User joined room: ${roomId}`);
    });

    // Handle sending a new message
    socket.on("new message", (message) => {
      const chatRoom = message.chat;
      io.to(chatRoom).emit("message received", message);
      logger.info(`📨 Message broadcasted to room: ${chatRoom}`);
    });

    // Handle disconnection
    socket.on("disconnect", (reason) => {
      logger.info(`🔴 User disconnected: ${socket.id}, Reason: ${reason}`);
    });
  });

  return io;
};
