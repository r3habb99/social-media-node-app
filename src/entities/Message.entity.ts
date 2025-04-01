import mongoose, { Schema, Model } from "mongoose";
import { IMessage } from "../interfaces";

const ObjectId = Schema.Types.ObjectId;

// Define the Mongoose Schema
const MessageSchema: Schema<IMessage> = new Schema(
  {
    sender: {
      type: ObjectId,
      ref: "User",
      required: true,
    },
    content: {
      type: String,
      trim: true,
      required: true,
    },
    chat: {
      type: ObjectId,
      ref: "Chat",
      required: true,
    },
    isDeleted: {
      type: Boolean,
      default: false,
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
    readBy: [
      {
        type: ObjectId,
        ref: "User",
      },
    ],
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

// Export the Mongoose Model
export const Message: Model<IMessage> = mongoose.model<IMessage>(
  "Message",
  MessageSchema
);
