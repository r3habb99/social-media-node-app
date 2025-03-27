import { getUserById, updateProfilePicture } from "../queries";
import { AuthRequest, logger, sendResponse } from "../services";
import { HttpResponseMessages, HttpStatusCodes } from "../constants";
import { Request, Response } from "express";

// Upload Profile Picture
export const uploadProfilePic = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.file) {
      logger.error("❌ No file uploaded");
      return sendResponse({
        res,
        statusCode: HttpStatusCodes.BAD_REQUEST,
        message: HttpResponseMessages.BAD_REQUEST,
        data: "No file uploaded!",
      });
    }

    const userId = req.user?.id; // This should now work
    console.log(userId, "userId");
    if (!userId) {
      logger.error("❌ User ID not found in request");
      return sendResponse({
        res,
        statusCode: HttpStatusCodes.UNAUTHORIZED,
        message: HttpResponseMessages.UNAUTHORIZED,
        data: "Unauthorized request",
      });
    }

    const imageUrl = `/uploads/images/${req.file.filename}`;
    const user = await updateProfilePicture(userId, imageUrl);

    if (!user) {
      logger.error("❌ User not found");
      return sendResponse({
        res,
        statusCode: HttpStatusCodes.NOT_FOUND,
        message: HttpResponseMessages.NOT_FOUND,
        data: "User not found!",
      });
    }

    logger.info("✅ Profile Picture Updated Successfully");
    return sendResponse({
      res,
      statusCode: HttpStatusCodes.OK,
      message: HttpResponseMessages.SUCCESS,
      data: { imageUrl, user },
    });
  } catch (error) {
    return sendResponse({
      res,
      statusCode: HttpStatusCodes.INTERNAL_SERVER_ERROR,
      message: HttpResponseMessages.INTERNAL_SERVER_ERROR,
      error,
    });
  }
};

// Get Profile with Picture
export const getUserProfile = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      logger.error("❌ User ID not found in request");
      return sendResponse({
        res,
        statusCode: HttpStatusCodes.UNAUTHORIZED,
        message: HttpResponseMessages.UNAUTHORIZED,
        data: "Unauthorized request",
      });
    }

    const user = await getUserById(userId);
    if (!user) {
      logger.error("❌ User not found");
      return sendResponse({
        res,
        statusCode: HttpStatusCodes.NOT_FOUND,
        message: HttpResponseMessages.NOT_FOUND,
        data: "User not found!",
      });
    }

    logger.info("✅ User Profile Retrieved Successfully");
    return sendResponse({
      res,
      statusCode: HttpStatusCodes.OK,
      message: HttpResponseMessages.SUCCESS,
      data: { user },
    });
  } catch (error) {
    logger.error("❌ Error fetching user profile", error);
    return sendResponse({
      res,
      statusCode: HttpStatusCodes.INTERNAL_SERVER_ERROR,
      message: HttpResponseMessages.INTERNAL_SERVER_ERROR,
      error,
    });
  }
};
