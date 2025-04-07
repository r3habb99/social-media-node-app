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
      return sendResponse({
        res,
        statusCode: HttpStatusCodes.BAD_REQUEST,
        message: HttpResponseMessages.BAD_REQUEST,
        data: "All fields are required",
      });
    }

    if (newPassword !== confirmPassword) {
      return sendResponse({
        res,
        statusCode: HttpStatusCodes.BAD_REQUEST,
        message: HttpResponseMessages.BAD_REQUEST,
        data: "New password and confirm password do not match",
      });
    }

    const user = await getUserForPassword(userId);
    if (!user || typeof user.password !== "string") {
      return sendResponse({
        res,
        statusCode: HttpStatusCodes.NOT_FOUND,
        message: HttpResponseMessages.NOT_FOUND,
        data: "User not found",
      });
    }

    const isMatch = await comparePassword(oldPassword, user.password);
    if (!isMatch) {
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
      return sendResponse({
        res,
        statusCode: HttpStatusCodes.BAD_REQUEST,
        message: HttpResponseMessages.BAD_REQUEST,
        data: "Email is required",
      });
    }

    if (!user) {
      return sendResponse({
        res,
        statusCode: HttpStatusCodes.NOT_FOUND,
        message: HttpResponseMessages.NOT_FOUND,
        data: "User with this email does not exist",
      });
    }
    // Ensure user properties exist before generating token
    if (!userId || !user.firstName || !user.email || !user.username) {
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

    await sendResetPasswordEmail(email, resetLink);
    logger.info(`✅ Password reset link sent to ${email}`);

    return sendResponse({
      res,
      statusCode: HttpStatusCodes.OK,
      message: HttpResponseMessages.SUCCESS,
      // data: "Reset link sent to email",
      data: resetToken,
    });
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
      return sendResponse({
        res,
        statusCode: HttpStatusCodes.BAD_REQUEST,
        message: HttpResponseMessages.BAD_REQUEST,
        data: "All fields are required",
      });
    }

    if (newPassword !== confirmPassword) {
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
