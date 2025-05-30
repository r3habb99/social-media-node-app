import { User } from "../entities";
import { logger } from "../services";
import { transformUserMediaUrls } from "../utils/userMediaUrl";
import { deleteFile, isDefaultAsset } from "../utils/fileSystem";

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

    // Get the current image URL before updating
    const currentImageUrl = userExists[field];

    // Delete the previous image file if it exists and is not a default asset
    if (currentImageUrl && !isDefaultAsset(currentImageUrl)) {
      logger.info(`Deleting previous ${field} file: ${currentImageUrl}`);
      const deleted = deleteFile(currentImageUrl);
      if (deleted) {
        logger.info(`Successfully deleted previous ${field} file`);
      } else {
        logger.warn(`Failed to delete previous ${field} file or file not found`);
      }
    }

    // Update the user document
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { [field]: imageUrl }, // Dynamically update field
      { new: true } // Return the updated document
    );

    if (updatedUser) {
      logger.info(`Successfully updated ${field} for user ${userId}`);
      return transformUserMediaUrls(updatedUser);
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
    return transformUserMediaUrls(user);
  } catch (error) {
    logger.error(`Error fetching user by id ${userId}:`, error);
    return null;
  }
};
// Get User Profile (excluding password)
export const getUserForPassword = async (userId: string) => {
  try {
    const user = await User.findById(userId).select("+password");
    return transformUserMediaUrls(user);
  } catch (error) {
    logger.error("Error fetching user by id", error);
    return null;
  }
};
