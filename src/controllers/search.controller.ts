import { Request, Response } from "express";
import { logger, sendResponse } from "../services";
import { HttpResponseMessages, HttpStatusCodes } from "../constants";
import { searchUsersInDB } from "../queries";
import { ISearch } from "../interfaces";

export const searchUsers = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { username, firstName, lastName, email } = req.query;

    // Ensure values are strings or undefined
    const searchParams: Partial<ISearch> = {
      username: typeof username === "string" ? username : undefined,
      firstName: typeof firstName === "string" ? firstName : undefined,
      lastName: typeof lastName === "string" ? lastName : undefined,
      email: typeof email === "string" ? email : undefined,
    };

    // Fetch users based on query
    const users = await searchUsersInDB(searchParams);

    if (!users.length) {
      return sendResponse({
        res,
        statusCode: HttpStatusCodes.NOT_FOUND,
        message: HttpResponseMessages.NOT_FOUND,
        data: "No users found",
      });
    }

    logger.info("✅ Users retrieved successfully");
    sendResponse({
      res,
      statusCode: HttpStatusCodes.OK,
      message: HttpResponseMessages.SUCCESS,
      data: users,
    });
  } catch (error) {
    logger.error("❌ Error searching users", error);
    sendResponse({
      res,
      statusCode: HttpStatusCodes.INTERNAL_SERVER_ERROR,
      message: HttpResponseMessages.INTERNAL_SERVER_ERROR,
      error,
    });
  }
};
