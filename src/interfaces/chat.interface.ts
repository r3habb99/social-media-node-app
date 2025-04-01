import mongoose, { Document } from "mongoose";

// Define an interface for the Chat document
export interface IChat extends Document {
  chatName: string;
  isGroupChat: boolean;
  users: mongoose.Types.ObjectId[];
  latestMessage?: mongoose.Types.ObjectId;
  isDeleted: Boolean;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date;
}
