import { getUserById, updateUserImage } from "../queries";
import { AuthRequest, logger, sendResponse } from "../services";
import { HttpResponseMessages, HttpStatusCodes } from "../constants";
import { Response } from "express";

// Upload Profile Picture
export const uploadProfilePic = async (req: AuthRequest, res: Response) => {
  try {
    logger.info("Starting profile picture upload process");

    // Check if file exists in the request
    if (!req.file) {
      logger.error("❌ No file uploaded");
      return sendResponse({
        res,
        statusCode: HttpStatusCodes.BAD_REQUEST,
        message: HttpResponseMessages.BAD_REQUEST,
        data: "No file uploaded!",
      });
    }

    // Log file details for debugging
    logger.info(
      `File details: ${JSON.stringify({
        filename: req.file.filename,
        originalname: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size,
        path: req.file.path,
      })}`
    );

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

    // Construct the URL path that will be used to access the image
    const imageUrl = `/uploads/profile-pictures/${req.file.filename}`;
    logger.info(`Image URL to be saved: ${imageUrl}`);

    // Update the user's profile picture in the database
    const user = await updateUserImage(userId, "profilePic", imageUrl);

    if (!user) {
      logger.error(`❌ User not found with ID: ${userId}`);
      return sendResponse({
        res,
        statusCode: HttpStatusCodes.NOT_FOUND,
        message: HttpResponseMessages.NOT_FOUND,
        data: "User not found!",
      });
    }

    logger.info(`✅ Profile Picture Updated Successfully for user: ${userId}`);
    return sendResponse({
      res,
      statusCode: HttpStatusCodes.OK,
      message: HttpResponseMessages.SUCCESS,
      data: { profilePic: imageUrl, user },
    });
  } catch (error) {
    logger.error("❌ Error in uploadProfilePic:", error);
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

// Upload Cover Photo
export const uploadCoverPhoto = async (req: AuthRequest, res: Response) => {
  try {
    logger.info("Starting cover photo upload process");

    // Check if file exists in the request
    if (!req.file) {
      logger.error("❌ No file uploaded");
      return sendResponse({
        res,
        statusCode: HttpStatusCodes.BAD_REQUEST,
        message: HttpResponseMessages.BAD_REQUEST,
        data: "No file uploaded!",
      });
    }

    // Log file details for debugging
    logger.info(
      `File details: ${JSON.stringify({
        filename: req.file.filename,
        originalname: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size,
        path: req.file.path,
      })}`
    );

    const userId = req.user?.id; // Get user ID from authenticated request
    if (!userId) {
      logger.error("❌ User not authenticated");
      return sendResponse({
        res,
        statusCode: HttpStatusCodes.UNAUTHORIZED,
        message: HttpResponseMessages.UNAUTHORIZED,
        data: "Unauthorized request",
      });
    }

    // Construct the URL path that will be used to access the image
    const coverPhotoUrl = `/uploads/cover-photos/${req.file.filename}`;
    logger.info(`Cover photo URL to be saved: ${coverPhotoUrl}`);

    // Update the user's cover photo in the database
    const user = await updateUserImage(userId, "coverPhoto", coverPhotoUrl);

    if (!user) {
      logger.error(`❌ User not found with ID: ${userId}`);
      return sendResponse({
        res,
        statusCode: HttpStatusCodes.NOT_FOUND,
        message: HttpResponseMessages.NOT_FOUND,
        data: "User not found!",
      });
    }

    logger.info(`✅ Cover Photo Updated Successfully for user: ${userId}`);
    return sendResponse({
      res,
      statusCode: HttpStatusCodes.OK,
      message: HttpResponseMessages.SUCCESS,
      data: { coverPhoto: coverPhotoUrl, user },
    });
  } catch (error) {
    logger.error("❌ Error uploading cover photo", error);
    return sendResponse({
      res,
      statusCode: HttpStatusCodes.INTERNAL_SERVER_ERROR,
      message: HttpResponseMessages.INTERNAL_SERVER_ERROR,
      error,
    });
  }
};
