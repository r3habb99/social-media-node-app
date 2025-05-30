import { User } from "../entities";
import { logger } from "../services";
import { transformUsersMediaUrls } from "../utils/userMediaUrl";

export const searchUsersInDB = async (query: string, currentUserId?: string) => {
  try {
    // Base search query
    const baseQuery = {
      $or: [
        { username: { $regex: query, $options: "i" } },
        { firstName: { $regex: query, $options: "i" } },
        { lastName: { $regex: query, $options: "i" } },
        { email: { $regex: query, $options: "i" } },
      ],
    };

    // If currentUserId is provided, exclude the current user from results
    const searchQuery = currentUserId
      ? {
          ...baseQuery,
          _id: { $ne: currentUserId } // Exclude the current user
        }
      : baseQuery;

    // Query the User collection with the built search query
    const users = await User.find(searchQuery);

    // Transform user profile pictures to full URLs
    return transformUsersMediaUrls(users);
  } catch (error) {
    logger.error("Error searching users in database", error);
    return []; // Return an empty array in case of error
  }
};
