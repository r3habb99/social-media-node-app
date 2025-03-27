import { Request, Response } from "express";
import {
  createUser,
  getAllUsers,
  getUser,
  updateUserById,
  deleteUsersByIds,
} from "../queries/User.queries";
import { comparePassword, hashPassword } from "../services/bcryptHelper";
import { logger } from "../services/logger";
import { sendResponse } from "../services/responseHelper";
import {
  ErrorMessageCodes,
  HttpResponseMessages,
  HttpStatusCodes,
} from "../constants";
import { generateToken } from "../services/jwtHelper";
import { saveToken } from "../queries/Token.queries";

// Register a new user
export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { firstName, lastName, email, password, username } = req.body;

    // Validate required fields
    if (!firstName || !lastName || !email || !password || !username) {
      logger.error("❌ Registration failed: Missing required fields");
      sendResponse({
        statusCode: HttpStatusCodes.BAD_REQUEST,
        res,
        message: HttpResponseMessages.BAD_REQUEST,
        data: "All fields are required",
      });
      return;
    }

    // Check if user already exists
    const existingUser = await getUser(email);
    if (existingUser) {
      logger.error("❌ Registration failed: Email already in use");
      sendResponse({
        statusCode: HttpStatusCodes.BAD_REQUEST,
        res,
        message: HttpResponseMessages.BAD_REQUEST,
        data: "Email already in use",
      });
      return;
    }

    // Hash Password
    const hashedPassword = await hashPassword(password);

    // Create & Save User
    const user = await createUser({
      firstName,
      lastName,
      email,
      password: hashedPassword,
      username,
      likes: [],
      retweets: [],
      following: [],
      followers: [],
      isActive: 1,
      isDeleted: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Send response
    const userData = {
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      username: user.username,
    };

    logger.info("✅ User Created Successfully");
    sendResponse({
      statusCode: HttpStatusCodes.CREATED,
      res,
      message: HttpResponseMessages.CREATED,
      data: { userData },
    });
  } catch (err) {
    logger.error("❌ Error while creating user", err);
    sendResponse({
      statusCode: HttpStatusCodes.INTERNAL_SERVER_ERROR,
      res,
      message: ErrorMessageCodes.INTERNAL_SERVER_ERROR,
      error: err,
    });
  }
};

// Login a user
export const loginUser = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    // Fetch user by email
    const user = await getUser(email);
    // Ensure _id is correctly typed as string
    const userId = user?._id as string;
    // Ensure user exists and has a password
    if (!user || typeof user.password !== "string") {
      logger.error(
        `Login failed: User not found or password missing (${email})`
      );
      return sendResponse({
        res,
        statusCode: HttpStatusCodes.NOT_FOUND,
        message: HttpResponseMessages.NOT_FOUND,
        data: "User not found",
      });
    }

    // Compare password securely
    const isMatch = await comparePassword(password, user.password);
    if (!isMatch) {
      logger.error(`Login failed: Invalid credentials for (${email})`);
      return sendResponse({
        res,
        statusCode: HttpStatusCodes.BAD_REQUEST,
        message: HttpResponseMessages.BAD_REQUEST,
        data: "Invalid Credentials",
      });
    }

    // Ensure user properties exist before generating token
    if (!userId || !user.firstName || !user.email || !user.username) {
      throw new Error("Missing required user properties for token generation");
    }

    // Generate token
    const token = generateToken({
      id: userId, // Ensure it's a string
      firstName: user.firstName, // Provide default values if needed
      email: user.email,
      username: user.username,
      userType: user.userType,
    });
    // Store token in DB
    await saveToken(userId, token);

    const userData = {
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      username: user.username,
    };

    logger.info(`User logged in successfully (${email})`);
    sendResponse({
      res,
      statusCode: HttpStatusCodes.OK,
      message: HttpResponseMessages.SUCCESS,
      data: { userData, token },
    });
  } catch (error) {
    logger.error("Error logging in", error);
    return sendResponse({
      res,
      statusCode: HttpStatusCodes.INTERNAL_SERVER_ERROR,
      message: HttpResponseMessages.INTERNAL_SERVER_ERROR,
      error: error,
    });
  }
};

// export const fetchUsers = async (_req: Request, res: Response) => {
//   try {
//     const users = await getAllUsers();
//     res.status(200).json(users);
//   } catch (error) {
//     res.status(500).json({ message: "Error fetching users", error });
//   }
// };

// export const fetchUserById = async (req: Request, res: Response) => {
//   try {
//     const user = await getUserById(req.params.id);
//     if (!user) return res.status(404).json({ message: "User not found" });
//     res.status(200).json(user);
//   } catch (error) {
//     res.status(500).json({ message: "Error fetching user", error });
//   }
// };

// export const updateUser = async (req: Request, res: Response) => {
//   try {
//     const updatedUser = await updateUserById(req.params.id, req.body);
//     if (!updatedUser)
//       return res.status(404).json({ message: "User not found" });
//     res.status(200).json({ message: "User updated successfully", updatedUser });
//   } catch (error) {
//     res.status(500).json({ message: "Error updating user", error });
//   }
// };

// export const deleteUsers = async (req: Request, res: Response) => {
//   try {
//     await deleteUsersByIds(req.body.userIds);
//     res.status(200).json({ message: "Users deleted successfully" });
//   } catch (error) {
//     res.status(500).json({ message: "Error deleting users", error });
//   }
// };
