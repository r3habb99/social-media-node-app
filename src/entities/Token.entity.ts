import mongoose, { Schema } from "mongoose";
import { IToken } from "../interfaces";

const TokenSchema = new Schema<IToken>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    token: {
      type: String,
      required: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
      expires: "7d", // Automatically deletes after 7 days
    },
  },
  {
    versionKey: false,
  }
);

const Token = mongoose.model<IToken>("Token", TokenSchema);
export default Token;
