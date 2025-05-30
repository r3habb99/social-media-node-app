import mongoose, { Schema, Document } from "mongoose";
import { INotification, INotificationModel } from "../interfaces";

const NotificationSchema = new Schema<INotification>(
  {
    userTo: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    userFrom: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    notificationType: {
      type: String,
      required: true,
    },
    opened: {
      type: Boolean,
      default: false,
    },
    entityId: {
      type: Schema.Types.ObjectId,
      required: true,
    },
    message: {
      type: String,
      default: "",
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

// Static method for inserting notifications
NotificationSchema.statics.insertNotification = async function (
  userTo: mongoose.Types.ObjectId,
  userFrom: mongoose.Types.ObjectId,
  notificationType: string,
  entityId: mongoose.Types.ObjectId,
  message?: string
): Promise<INotification | null> {
  try {
    const data = { userTo, userFrom, notificationType, entityId, message };
    await this.deleteOne({ userTo, userFrom, notificationType, entityId });
    return await this.create(data);
  } catch (error) {
    console.error("Error inserting notification:", error);
    return null;
  }
};

export const Notification = mongoose.model<INotification, INotificationModel>(
  "Notification",
  NotificationSchema
);
