import { User } from "../entities";
import { ISearch } from "../interfaces";
import { logger } from "../services";

export const searchUsersInDB = async ({
  username,
  firstName,
  lastName,
  email,
}: ISearch) => {
  try {
    const query: any = {};
    if (username) query.username = { $regex: username, $options: "i" };
    if (firstName) query.firstName = { $regex: firstName, $options: "i" };
    if (lastName) query.lastName = { $regex: lastName, $options: "i" };
    if (email) query.email = { $regex: email, $options: "i" };

    return await User.find(query);
  } catch (error) {
    logger.error("Error searching users in database", error);
    return [];
  }
};
