import { Request, Response } from "express";
import { HttpResponseMessages, HttpStatusCodes } from "../constants";
import {
  AuthRequest,
  comparePassword,
  generateToken,
  hashPassword,
  logger,
  sendResetPasswordEmail,
  sendResponse,
  verifyToken,
} from "../services";
import {
  getUser,
  getUserById,
  getUserForPassword,
  updateUserById,
} from "../queries";

export const resetPassword = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user?.id as string;
    const { oldPassword, newPassword, confirmPassword } = req.body;

    if (!userId || !oldPassword || !newPassword || !confirmPassword) {
      logger.info("All fields are required");
      return sendResponse({
        res,
        statusCode: HttpStatusCodes.BAD_REQUEST,
        message: HttpResponseMessages.BAD_REQUEST,
        data: "All fields are required",
      });
    }

    if (newPassword !== confirmPassword) {
      logger.info("New password and confirm password do not match");
      return sendResponse({
        res,
        statusCode: HttpStatusCodes.BAD_REQUEST,
        message: HttpResponseMessages.BAD_REQUEST,
        data: "New password and confirm password do not match",
      });
    }

    const user = await getUserForPassword(userId);
    if (!user || typeof user.password !== "string") {
      logger.info("User not found or password is not a string");
      return sendResponse({
        res,
        statusCode: HttpStatusCodes.NOT_FOUND,
        message: HttpResponseMessages.NOT_FOUND,
        data: "User not found",
      });
    }

    const isMatch = await comparePassword(oldPassword, user.password);
    if (!isMatch) {
      logger.info("Old password is incorrect");
      return sendResponse({
        res,
        statusCode: HttpStatusCodes.BAD_REQUEST,
        message: HttpResponseMessages.BAD_REQUEST,
        data: "Old password is incorrect",
      });
    }

    const hashedPassword = await hashPassword(newPassword);
    await updateUserById(userId, { password: hashedPassword });

    logger.info(`✅ Password reset successfully for user (${userId})`);
    return sendResponse({
      res,
      statusCode: HttpStatusCodes.OK,
      message: HttpResponseMessages.SUCCESS,
      data: "Password reset successfully",
    });
  } catch (error) {
    logger.error("❌ Error resetting password", error);
    return sendResponse({
      res,
      statusCode: HttpStatusCodes.INTERNAL_SERVER_ERROR,
      message: HttpResponseMessages.INTERNAL_SERVER_ERROR,
      error,
    });
  }
};

export const forgotPassword = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { email } = req.body;
    const user = await getUser(email);
    const userId = user?._id as string;
    if (!email) {
      logger.info("Email is required");
      return sendResponse({
        res,
        statusCode: HttpStatusCodes.BAD_REQUEST,
        message: HttpResponseMessages.BAD_REQUEST,
        data: "Email is required",
      });
    }

    if (!user) {
      logger.info("User with this email does not exist");
      return sendResponse({
        res,
        statusCode: HttpStatusCodes.NOT_FOUND,
        message: HttpResponseMessages.NOT_FOUND,
        data: "User with this email does not exist",
      });
    }
    // Ensure user properties exist before generating token
    if (!userId || !user.firstName || !user.email || !user.username) {
      logger.info("Missing required user properties for token generation");

      throw new Error("Missing required user properties for token generation");
    }
    // Generate token
    const resetToken = generateToken({
      id: userId, // Ensure it's a string
      firstName: user.firstName, // Provide default values if needed
      email: user.email,
      username: user.username,
      userType: user.userType,
    });
    const resetLink = `${process.env.CLIENT_URL}/reset-password/${resetToken}`;
    logger.info(`Generated reset link for user ${userId}`);

    try {
      await sendResetPasswordEmail(email, resetLink);
      logger.info(`✅ Password reset link sent to ${email}`);
      return sendResponse({
        res,
        statusCode: HttpStatusCodes.OK,
        message: "Password reset link sent to your email successfully",
        data: {
          message: "Please check your email for the password reset link",
          email: email,
          // Remove token from response in production for security
          ...(process.env.NODE_ENV === "development" && { resetToken })
        },
      });
    } catch (emailError) {
      logger.error(`❌ Failed to send email to ${email}:`, emailError);
      return sendResponse({
        res,
        statusCode: HttpStatusCodes.SERVICE_UNAVAILABLE,
        message: "Email service temporarily unavailable",
        error: emailError instanceof Error ? emailError.message : "Failed to send email",
      });
    }
  } catch (error) {
    logger.error("❌ Error sending forgot password email", error);
    return sendResponse({
      res,
      statusCode: HttpStatusCodes.INTERNAL_SERVER_ERROR,
      message: HttpResponseMessages.INTERNAL_SERVER_ERROR,
      error,
    });
  }
};

export const submitNewPassword = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { token } = req.params;
    const { newPassword, confirmPassword } = req.body;

    if (!token || !newPassword || !confirmPassword) {
      logger.info("All fields are required");
      return sendResponse({
        res,
        statusCode: HttpStatusCodes.BAD_REQUEST,
        message: HttpResponseMessages.BAD_REQUEST,
        data: "All fields are required",
      });
    }

    if (newPassword !== confirmPassword) {
      logger.info("Passwords do not match");
      return sendResponse({
        res,
        statusCode: HttpStatusCodes.BAD_REQUEST,
        message: HttpResponseMessages.BAD_REQUEST,
        data: "Passwords do not match",
      });
    }

    const decoded = verifyToken(token, process.env.JWT_SECRET as string) as {
      id: string;
    };
    const user = await getUserById(decoded.id);

    if (!user) {
      logger.info("Invalid or expired token");
      return sendResponse({
        res,
        statusCode: HttpStatusCodes.NOT_FOUND,
        message: HttpResponseMessages.NOT_FOUND,
        data: "Invalid or expired token",
      });
    }

    const hashedPassword = await hashPassword(newPassword);
    await updateUserById(decoded.id, { password: hashedPassword });

    logger.info(`✅ Password updated via reset link for (${decoded.id})`);
    return sendResponse({
      res,
      statusCode: HttpStatusCodes.OK,
      message: HttpResponseMessages.SUCCESS,
      data: "Password updated successfully",
    });
  } catch (error) {
    logger.error("❌ Error resetting password with token", error);
    return sendResponse({
      res,
      statusCode: HttpStatusCodes.INTERNAL_SERVER_ERROR,
      message: HttpResponseMessages.INTERNAL_SERVER_ERROR,
      error,
    });
  }
};
