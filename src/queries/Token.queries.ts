import Token from "../entities/Token.entity";
import { logger } from "../services/logger";

/**
 * Saves a token in the database.
 * If a token for the user already exists, replace it.
 * @param userId - The ID of the user
 * @param token - The JWT token
 */
export const saveToken = async (
  userId: string,
  token: string
): Promise<void> => {
  try {
    await Token.findOneAndUpdate(
      { userId },
      { token, createdAt: new Date() },
      { upsert: true, new: true }
    );
  } catch (error) {
    logger.error("Error saving token: " + error);
    return;
  }
};

/**
 * Deletes a user's token (for logout).
 * @param userId - The ID of the user
 */
export const deleteToken = async (userId: string): Promise<void> => {
  try {
    await Token.deleteOne({ userId });
  } catch (error) {
    logger.error("Error deleting token: " + error);
    return;
  }
};

/**
 * Finds a token by user ID.
 * @param userId - The ID of the user
 * @returns The found token or null
 */
export const findToken = async (userId: string) => {
  return await Token.findOne({ userId });
};
