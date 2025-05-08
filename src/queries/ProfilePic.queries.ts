import { User } from "../entities";
import { logger } from "../services";

// Update Profile Picture or Cover Photo
export const updateUserImage = async (
  userId: string,
  field: "profilePic" | "coverPhoto",
  imageUrl: string
) => {
  try {
    logger.info(`Updating user ${userId} ${field} with URL: ${imageUrl}`);

    // Validate inputs
    if (!userId || !field || !imageUrl) {
      logger.error(
        `Invalid parameters for updateUserImage: userId=${userId}, field=${field}, imageUrl=${imageUrl}`
      );
      return null;
    }

    // Check if user exists before updating
    const userExists = await User.findById(userId);
    if (!userExists) {
      logger.error(`User with ID ${userId} not found`);
      return null;
    }

    // Update the user document
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { [field]: imageUrl }, // Dynamically update field
      { new: true } // Return the updated document
    );

    if (updatedUser) {
      logger.info(`Successfully updated ${field} for user ${userId}`);
      return updatedUser;
    } else {
      logger.error(`Failed to update ${field} for user ${userId}`);
      return null;
    }
  } catch (error) {
    logger.error(`Error updating ${field} for user ${userId}:`, error);
    return null;
  }
};

// Get User Profile (excluding password)
export const getUserById = async (userId: string) => {
  try {
    logger.info(`Fetching user profile for ID: ${userId}`);

    if (!userId) {
      logger.error("Invalid user ID provided");
      return null;
    }

    const user = await User.findById(userId).select("-password");

    if (!user) {
      logger.error(`User with ID ${userId} not found`);
      return null;
    }

    logger.info(`Successfully retrieved user profile for ID: ${userId}`);
    return user;
  } catch (error) {
    logger.error(`Error fetching user by id ${userId}:`, error);
    return null;
  }
};
// Get User Profile (excluding password)
export const getUserForPassword = async (userId: string) => {
  try {
    return await User.findById(userId).select("+password");
  } catch (error) {
    logger.error("Error fetching user by id", error);
    return null;
  }
};
