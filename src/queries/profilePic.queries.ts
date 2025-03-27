import User from "../entities/User.entity";
import { logger } from "../services";

// Update Profile Picture
export const updateProfilePicture = async (
  userId: string,
  imageUrl: string
) => {
  try {
    return await User.findByIdAndUpdate(
      userId,
      { profilePic: imageUrl },
      { new: true }
    );
  } catch (error) {
    logger.error("Error updating profile picture", error);
    return null;
  }
};

// Get User Profile (excluding password)
export const getUserById = async (userId: string) => {
  try {
    return await User.findById(userId).select("-password");
  } catch (error) {
    logger.error("Error fetching user by id", error);
    return null;
  }
};
