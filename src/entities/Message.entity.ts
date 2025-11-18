import mongoose, { Schema, Model, Document } from "mongoose";
import { IMessage, MessageType, MessageStatus } from "../interfaces";

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
      required: false, // Content is optional when media is provided
      default: "", // Default to empty string for media-only messages
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
    messageType: {
      type: String,
      enum: Object.values(MessageType),
      default: MessageType.TEXT,
    },
    status: {
      type: String,
      enum: Object.values(MessageStatus),
      default: MessageStatus.SENT,
    },
    media: {
      type: [String],
      default: [],
    },
    replyTo: {
      type: ObjectId,
      ref: "Message",
      default: null,
    },
    // Encryption fields for end-to-end encryption
    iv: {
      type: String,
      required: false, // Optional for backward compatibility
    },
    authTag: {
      type: String,
      required: false, // Optional for backward compatibility
    },
  },
  {
    timestamps: true,
    versionKey: false,
    toJSON: {
      transform(doc: Document, ret: any) {
        ret.id = ret._id;
        delete ret._id;
        // Don't expose encryption metadata to client
        // (they're only needed internally for decryption)
      },
    },
  }
);

// Export the Mongoose Model
export const Message: Model<IMessage> = mongoose.model<IMessage>(
  "Message",
  MessageSchema
);
