import { User } from "../entities";
import { logger } from "../services";

export const searchUsersInDB = async (query: string) => {
  try {
    const searchQuery = {
      $or: [
        { username: { $regex: query, $options: "i" } },
        { firstName: { $regex: query, $options: "i" } },
        { lastName: { $regex: query, $options: "i" } },
        { email: { $regex: query, $options: "i" } },
      ],
    };

    // Query the User collection with the built search query
    const users = await User.find(searchQuery);

    return users; // Return the users matching the search query
  } catch (error) {
    logger.error("Error searching users in database", error);
    return []; // Return an empty array in case of error
  }
};
