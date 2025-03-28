import mongoose, { Document } from "mongoose";

export interface IPost extends Document {
  content?: string;
  postedBy: mongoose.Types.ObjectId;
  pinned?: boolean;
  likes: mongoose.Types.ObjectId[];
  retweetUsers: mongoose.Types.ObjectId[];
  retweetData?: mongoose.Types.ObjectId;
  replyTo?: mongoose.Types.ObjectId;
  media?: string[]; // Array of image/video URLs
  mediaType?: "image" | "video";
  visibility?: "public" | "private" | "followers";
  isDeleted?: number;
  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date;
}
