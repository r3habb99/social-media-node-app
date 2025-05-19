import mongoose, { Document, Model } from "mongoose";

export interface INotification extends Document {
  userTo?: mongoose.Types.ObjectId;
  userFrom?: mongoose.Types.ObjectId;
  notificationType?: string;
  opened?: boolean;
  entityId?: mongoose.Types.ObjectId;
  message?: string;
  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date | null;
}

export interface INotificationModel extends Model<INotification> {
  insertNotification(
    userTo?: mongoose.Types.ObjectId,
    userFrom?: mongoose.Types.ObjectId,
    notificationType?: string,
    entityId?: mongoose.Types.ObjectId,
    message?: string
  ): Promise<INotification | null>;
}

