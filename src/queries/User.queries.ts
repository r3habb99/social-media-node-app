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
    return await User.findOne({ email }).lean(); // `.lean()` returns plain JS object
  } catch (error) {
    logger.error("❌ Error fetching user by email: ", error);
    return null;
  }
};

export const getUserByID = async (userId: string): Promise<IUser | null> => {
  try {
    return await User.findById(userId).lean();
  } catch (error) {
    logger.error("❌ Error fetching user by ID:", error);
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
