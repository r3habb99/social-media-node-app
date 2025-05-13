import mongoose, { Document } from "mongoose";

export interface IPost extends Document {
  content?: string;
  postedBy: mongoose.Types.ObjectId;
  pinned?: boolean;
  likes: mongoose.Types.ObjectId[];
  retweetUsers: mongoose.Types.ObjectId[];
  retweetData?: mongoose.Types.ObjectId;
  replyTo?: mongoose.Types.ObjectId;
  media?: string[]; // Array of media URLs (images/videos)
  mediaType?: "image" | "video"; // Type of media
  visibility?: "public" | "private" | "followers"; // Post visibility settings
  isDeleted?: boolean; // Soft delete flag
  deletedAt?: Date | null; // Timestamp for soft deletion
  createdAt: Date; // Timestamp for creation
  updatedAt: Date; // Timestamp for last update
  commentCount?: number; // Number of comments on this post (added dynamically)
}
