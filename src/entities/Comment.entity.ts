import mongoose, { Schema, Model, Document } from "mongoose";
import { IComment } from "../interfaces";

const CommentSchema = new Schema<IComment>(
  {
    content: {
      type: String,
      required: true,
      trim: true,
    },
    postId: {
      type: Schema.Types.ObjectId,
      ref: "Post",
      required: true,
    },
    author: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    likes: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    replyTo: {
      type: Schema.Types.ObjectId,
      ref: "Comment",
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
    deletedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    versionKey: false,
    toJSON: {
      transform(doc: Document, ret: any) {
        ret.id = ret._id;
        delete ret._id;
      },
    },
  }
);

// Create indexes for better query performance
CommentSchema.index({ postId: 1, createdAt: -1 });
CommentSchema.index({ author: 1 });
CommentSchema.index({ replyTo: 1 });

export const Comment: Model<IComment> = mongoose.model<IComment>("Comment", CommentSchema);
