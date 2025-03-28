import mongoose, { Schema, Document, Model } from "mongoose";
import { IPost } from "../interfaces";

const PostSchema = new Schema<IPost>(
  {
    content: {
      type: String,
      trim: true,
    },
    postedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    pinned: {
      type: Boolean,
      default: false,
    },
    likes: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    retweetUsers: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    retweetData: {
      type: Schema.Types.ObjectId,
      ref: "Post",
    },
    replyTo: {
      type: Schema.Types.ObjectId,
      ref: "Post",
    },
    media: [
      {
        type: String,
      },
    ], // URLs for uploaded media (images/videos)
    mediaType: {
      type: String,
      enum: ["image", "video"],
    },
    visibility: {
      type: String,
      enum: ["public", "private", "followers"],
      default: "public",
    },
    isDeleted: {
      type: Number,
      default: 0,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
    deletedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    versionKey: "__v",
    toJSON: {
      transform(doc: Document, ret: any) {
        ret.id = ret._id;
        delete ret._id;
      },
    },
  }
);

export const Post: Model<IPost> = mongoose.model<IPost>("Post", PostSchema);
