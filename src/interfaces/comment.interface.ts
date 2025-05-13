import mongoose, { Document } from "mongoose";

export interface IComment extends Document {
  content: string;
  postId: mongoose.Types.ObjectId;
  author: mongoose.Types.ObjectId;
  likes: mongoose.Types.ObjectId[];
  replyTo?: mongoose.Types.ObjectId; // Reference to parent comment if this is a reply
  isDeleted: boolean;
  deletedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}
