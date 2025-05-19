import mongoose, { Document } from "mongoose";
import { UserType } from "../constants";

export interface IUser extends Document {
  id?: string;
  firstName?: string;
  lastName?: string;
  username?: string;
  email?: string;
  password?: string;
  profilePic?: string;
  coverPhoto?: string;
  bio?: string; 
  likes?: mongoose.Types.ObjectId[];
  retweets?: mongoose.Types.ObjectId[];
  following?: mongoose.Types.ObjectId[];
  followers?: mongoose.Types.ObjectId[];
  isActive?: number;
  isDeleted?: number;
  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date | null;
  userType: UserType; // Add userType here
}
