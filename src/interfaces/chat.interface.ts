import mongoose, { Document } from "mongoose";
import { IUser } from "./user.interface";

// Define an interface for the Chat document
export interface IChat extends Document {
  chatName: string;
  isGroupChat: boolean;
  users: mongoose.Types.ObjectId[] | IUser[];
  latestMessage?: mongoose.Types.ObjectId;
  isDeleted: Boolean;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date;
}

// Interface for populated chat with user details
export interface IPopulatedChat extends Omit<IChat, "users"> {
  users: IUser[];
}
