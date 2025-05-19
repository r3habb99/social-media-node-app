import { Request, Response } from "express";
import {
  ErrorMessageCodes,
  HttpResponseMessages,
  HttpStatusCodes,
} from "../constants";
import {
  AuthRequest,
  comparePassword,
  generateToken,
  hashPassword,
  logger,
  sendResponse,
} from "../services";
import {
  createUser,
  getUser,
  getUserByUsername,
  getUserById,
  getUserProfileWithStats,
  removeToken,
  saveToken,
  searchUser,
  updateUserById,
} from "../queries";

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
    const { email, password, username } = req.body;

    // Check if either email or username is provided
    if (!email && !username) {
      logger.error("Login failed: Email or username is required");
      return sendResponse({
        res,
        statusCode: HttpStatusCodes.BAD_REQUEST,
        message: HttpResponseMessages.BAD_REQUEST,
        data: "Email or username is required",
      });
    }

    // Attempt to find user by email first, then by username if email is not provided
    let user = null;
    let identifier = "";

    if (email) {
      user = await getUser(email);
      identifier = email;
    } else if (username) {
      user = await getUserByUsername(username);
      identifier = username;
    }

    // Ensure _id is correctly typed as string
    const userId = user?._id as string;

    // Ensure user exists and has a password
    if (!user || typeof user.password !== "string") {
      logger.error(
        `Login failed: User not found or password missing (${identifier})`
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
      logger.error(`Login failed: Invalid credentials for (${identifier})`);
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
      id: userId,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      username: user.username,
    };

    logger.info(`User logged in successfully (${identifier})`);
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

export const logoutUser = async (req: Request, res: Response) => {
  try {
    // Check for token in query parameter first (for Swagger testing)
    let token = req.query.token as string;

    // If not in query, try to get from Authorization header
    if (!token) {
      const authHeader = req.header("Authorization");
      if (!authHeader) {
        return sendResponse({
          res,
          statusCode: HttpStatusCodes.BAD_REQUEST,
          message: HttpResponseMessages.BAD_REQUEST,
          data: "Token is required",
        });
      }

      token = authHeader.split(" ")[1];
    }

    if (!token) {
      return sendResponse({
        res,
        statusCode: HttpStatusCodes.BAD_REQUEST,
        message: HttpResponseMessages.BAD_REQUEST,
        data: "Token is missing",
      });
    }

    // Remove token from database
    await removeToken(token);

    logger.info("User logged out successfully");
    sendResponse({
      res,
      statusCode: HttpStatusCodes.OK,
      message: HttpResponseMessages.SUCCESS,
      data: "User logged out successfully",
    });
  } catch (error) {
    logger.error("Error logging out", error);
    return sendResponse({
      res,
      statusCode: HttpStatusCodes.INTERNAL_SERVER_ERROR,
      message: HttpResponseMessages.INTERNAL_SERVER_ERROR,
      error: error,
    });
  }
};

export const updateUser = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user?.id;
    const updateData = req.body;

    if (!userId || Object.keys(updateData).length === 0) {
      return sendResponse({
        res,
        statusCode: HttpStatusCodes.BAD_REQUEST,
        message: HttpResponseMessages.BAD_REQUEST,
        data: "User ID and update data are required",
      });
    }

    const updatedUser = await updateUserById(userId, updateData);

    if (!updatedUser) {
      return sendResponse({
        res,
        statusCode: HttpStatusCodes.NOT_FOUND,
        message: HttpResponseMessages.NOT_FOUND,
        data: "User not found",
      });
    }

    logger.info(`✅ User (${userId}) updated successfully`);
    return sendResponse({
      res,
      statusCode: HttpStatusCodes.OK,
      message: HttpResponseMessages.SUCCESS,
      data: updatedUser,
    });
  } catch (error) {
    logger.error("❌ Error updating user", error);
    return sendResponse({
      res,
      statusCode: HttpStatusCodes.INTERNAL_SERVER_ERROR,
      message: HttpResponseMessages.INTERNAL_SERVER_ERROR,
      error,
    });
  }
};

export const fetchUser = async (req: Request, res: Response): Promise<void> => {
  try {
    // Retrieve the 'query' parameter from the request
    const { query } = req.query; // Extract 'query' from query parameters

    if (!query || typeof query !== "string" || query.trim() === "") {
      // If no query is provided, send a bad request response
      return sendResponse({
        res,
        statusCode: HttpStatusCodes.BAD_REQUEST,
        message: HttpResponseMessages.BAD_REQUEST,
        data: "Please provide a valid search query.",
      });
    }

    // Proceed with searching users
    const users = await searchUser(query);

    if (!users.length) {
      return sendResponse({
        res,
        statusCode: HttpStatusCodes.NOT_FOUND,
        message: HttpResponseMessages.NOT_FOUND,
        data: "No users found matching your search query.",
      });
    }

    // If users are found, send them in the response
    logger.info("✅ Users retrieved successfully");
    sendResponse({
      res,
      statusCode: HttpStatusCodes.OK,
      message: HttpResponseMessages.SUCCESS,
      data: users,
    });
  } catch (error) {
    // Catch any errors and send an internal server error response
    logger.error("❌ Error searching users", error);
    sendResponse({
      res,
      statusCode: HttpStatusCodes.INTERNAL_SERVER_ERROR,
      message: HttpResponseMessages.INTERNAL_SERVER_ERROR,
      error,
    });
  }
};

export const getUserID = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    const user = await getUserById(userId);
    if (!user) {
      logger.error("❌ User not found");
      return sendResponse({
        res,
        statusCode: HttpStatusCodes.NOT_FOUND,
        message: HttpResponseMessages.NOT_FOUND,
        data: "User not found",
      });
    }
    logger.info("✅ User Profile Retrieved Successfully");
    return sendResponse({
      res,
      statusCode: HttpStatusCodes.OK,
      message: HttpResponseMessages.SUCCESS,
      data: user,
    });
  } catch (error) {
    logger.error("Error in getUserProfile controller:", error);
    return sendResponse({
      res,
      statusCode: HttpStatusCodes.INTERNAL_SERVER_ERROR,
      message: HttpResponseMessages.INTERNAL_SERVER_ERROR,
      error,
    });
  }
};

/**
 * Get user profile with comprehensive stats and paginated posts, replies, likes, and media
 */
export const getUserProfileWithPostStats = async (req: AuthRequest, res: Response) => {
  try {
    const { userId } = req.params;

    // Extract pagination and filtering parameters
    const {
      max_id,
      since_id,
      limit,
      content_type, // 'posts', 'replies', 'likes', 'media'
      include_comments
    } = req.query;

    // Create pagination options
    const paginationOptions = {
      max_id: max_id as string | undefined,
      since_id: since_id as string | undefined,
      limit: limit ? parseInt(limit as string, 10) : 10, // Default to 10 items per page
      contentType: (content_type as string) || 'posts', // Default to posts if not specified
      includeComments: include_comments === 'false' ? false : true, // Default to true if not specified
    };

    // Get user profile with stats and paginated content
    const result = await getUserProfileWithStats(userId, paginationOptions);

    if (!result.user) {
      logger.error("❌ User not found");
      return sendResponse({
        res,
        statusCode: HttpStatusCodes.NOT_FOUND,
        message: HttpResponseMessages.NOT_FOUND,
        data: "User not found",
      });
    }

    logger.info(`✅ User Profile with Stats Retrieved Successfully (content type: ${paginationOptions.contentType})`);
    return sendResponse({
      res,
      statusCode: HttpStatusCodes.OK,
      message: HttpResponseMessages.SUCCESS,
      data: result,
    });
  } catch (error) {
    logger.error("Error in getUserProfileWithPostStats controller:", error);
    return sendResponse({
      res,
      statusCode: HttpStatusCodes.INTERNAL_SERVER_ERROR,
      message: HttpResponseMessages.INTERNAL_SERVER_ERROR,
      error,
    });
  }
};


