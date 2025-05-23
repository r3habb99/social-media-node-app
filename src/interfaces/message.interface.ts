import mongoose, { Document } from "mongoose";
import { IUser } from "./user.interface";
import { IChat } from "./chat.interface";

// Message type enum
export enum MessageType {
  TEXT = "text",
  IMAGE = "image",
  VIDEO = "video",
  FILE = "file",
  AUDIO = "audio",
  SYSTEM = "system"
}

// Message status enum
export enum MessageStatus {
  SENT = "sent",
  DELIVERED = "delivered",
  READ = "read",
  FAILED = "failed"
}

// Define an interface for the Message document
export interface IMessage extends Document {
  sender: mongoose.Types.ObjectId | IUser;
  content: string;
  chat: mongoose.Types.ObjectId | IChat;
  readBy: mongoose.Types.ObjectId[] | IUser[];
  isDeleted: Boolean;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
  messageType: MessageType;
  status: MessageStatus;
  media?: string[]; // Array of media URLs
  replyTo?: mongoose.Types.ObjectId | IMessage; // For reply functionality
}

// Interface for populated message with user details
export interface IPopulatedMessage extends Omit<IMessage, "sender" | "readBy" | "chat" | "replyTo"> {
  sender: IUser;
  readBy: IUser[];
  chat: IChat;
  replyTo?: IPopulatedMessage;
}
