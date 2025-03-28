import { User } from "../entities";
import { logger } from "../services";

// Update Profile Picture
export const updateUserImage = async (
  userId: string,
  field: "profilePic" | "coverPhoto",
  imageUrl: string
) => {
  try {
    return await User.findByIdAndUpdate(
      userId,
      { [field]: imageUrl }, // Dynamically update field
      { new: true }
    );
  } catch (error) {
    logger.error(`Error updating ${field}`, error);
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
