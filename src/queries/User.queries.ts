import { User } from "../entities";
import { IUser } from "../interfaces";
import { logger } from "../services";

export const createUser = async (userData: Partial<IUser>): Promise<IUser> => {
  try {
    const user = new User(userData);
    return await user.save();
  } catch (error) {
    logger.error("❌ Error in creating user: ", error);
    throw error;
  }
};
export const getAllUsers = async () => {
  try {
    return await User.find();
  } catch (error) {
    logger.error("❌ Error in fetching users: ", error);
    return error;
  }
};

export const getUser = async (email: string): Promise<IUser | null> => {
  try {
    return await User.findOne({ email }).lean();
  } catch (error) {
    logger.error("❌ Error fetching user by email: ", error);
    return null;
  }
};

export const updateUserById = async (
  userId: string,
  updateData: Partial<IUser>
): Promise<IUser | null> => {
  try {
    return await User.findByIdAndUpdate(userId, updateData, { new: true });
  } catch (error) {
    logger.error("❌ Error updating user:", error);
    throw error;
  }
};

export const deleteUsersByIds = async (userIds: string[]) => {
  try {
    return await User.updateMany(
      { _id: { $in: userIds } },
      { isDeleted: 1, deletedAt: new Date() }
    );
  } catch (error) {
    logger.error("❌ Error in deleting users by IDs: ", error);
    return error;
  }
};

export const searchUser = async (query: string) => {
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
