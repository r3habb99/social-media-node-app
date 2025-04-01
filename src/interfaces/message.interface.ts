import mongoose, { Document } from "mongoose";

// Define an interface for the Message document
export interface IMessage extends Document {
  sender: mongoose.Types.ObjectId;
  content: string;
  chat: mongoose.Types.ObjectId;
  readBy: mongoose.Types.ObjectId[];
  isDeleted: Boolean;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date;
}
