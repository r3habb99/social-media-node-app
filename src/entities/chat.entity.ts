import mongoose, { Schema, Model } from "mongoose";
import { IChat } from "../interfaces";

const ObjectId = Schema.Types.ObjectId;
// Define the Mongoose Schema
const ChatSchema: Schema<IChat> = new Schema(
  {
    chatName: {
      type: String,
      trim: true,
      required: true,
    },
    isGroupChat: {
      type: Boolean,
      default: false,
    },
    users: [
      {
        type: ObjectId,
        ref: "User",
        required: true,
      },
    ],
    latestMessage: {
      type: ObjectId,
      ref: "Message",
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
export const Chat: Model<IChat> = mongoose.model<IChat>("Chat", ChatSchema);
