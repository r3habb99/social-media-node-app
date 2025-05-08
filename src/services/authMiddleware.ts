import { Request, Response, NextFunction } from "express";
import { JwtPayload } from "jsonwebtoken";
import dotenv from "dotenv";
import { HttpResponseMessages, HttpStatusCodes } from "../constants";
import { JWT_SECRET } from "../config";
import { logger } from "../services/logger";
import { sendResponse } from "./responseHelper";
import { verifyToken } from "./jwtHelper";
import { findToken } from "../queries";

dotenv.config();

export interface AuthRequest extends Request {
  user?: JwtPayload;
  files?: Express.Multer.File[] | { [fieldname: string]: Express.Multer.File[] };
  file?: Express.Multer.File;
}

export const authMiddleware = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.header("Authorization");
    if (!authHeader) {
      logger.error("Access denied, header not found");
      return sendResponse({
        res,
        statusCode: HttpStatusCodes.UNAUTHORIZED,
        message: HttpResponseMessages.UNAUTHORIZED,
        error: "Access Denied, Header not found",
      });
    }

    const token = authHeader.split(" ")[1];

    if (!token) {
      logger.error("Access Denied, token missing");
      return sendResponse({
        res,
        statusCode: HttpStatusCodes.UNAUTHORIZED,
        message: HttpResponseMessages.UNAUTHORIZED,
        error: "Access Denied, Token Missing",
      });
    }

    const secret = JWT_SECRET;
    if (!secret) {
      logger.error("JWT_SECRET is not defined");
      throw new Error("JWT_SECRET is not defined");
    }

    // Verify token
    const decoded = verifyToken(token, secret);
    if (!decoded) {
      logger.error("Unauthorized: Invalid or expired token");
      return sendResponse({
        res,
        statusCode: HttpStatusCodes.UNAUTHORIZED,
        message: HttpResponseMessages.UNAUTHORIZED,
        error: "Unauthorized: Invalid or expired token",
      });
    }

    // Check if token exists in the database
    const storedToken = await findToken(token);
    if (!storedToken) {
      logger.error("Unauthorized: Token not found in database");
      return sendResponse({
        res,
        statusCode: HttpStatusCodes.UNAUTHORIZED,
        message: HttpResponseMessages.UNAUTHORIZED,
        error: "Unauthorized: Invalid or expired token",
      });
    }

    req.user = decoded;
    logger.info(`Token verified successfully for user: ${decoded.id}`);
    next();
  } catch (err) {
    logger.error("Invalid Token Found", err);
    return sendResponse({
      res,
      statusCode: HttpStatusCodes.UNAUTHORIZED,
      message: HttpResponseMessages.UNAUTHORIZED,
      error: "Invalid Token Found",
    });
  }
};
