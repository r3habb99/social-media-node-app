import { Request, Response } from "express";
import { logger, sendResponse } from "../services";
import { HttpResponseMessages, HttpStatusCodes } from "../constants";
import { searchUsersInDB } from "../queries";

export const searchUsers = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    // Extract search parameters from the request query
    const { firstName, lastName, username, email, query } = req.query;

    // Check if any search parameter is provided
    if ((!firstName && !lastName && !username && !email && !query) ||
        (firstName && typeof firstName !== "string") ||
        (lastName && typeof lastName !== "string") ||
        (username && typeof username !== "string") ||
        (email && typeof email !== "string") ||
        (query && typeof query !== "string")) {
      // If no valid search parameter is provided, send a bad request response
      return sendResponse({
        res,
        statusCode: HttpStatusCodes.BAD_REQUEST,
        message: HttpResponseMessages.BAD_REQUEST,
        data: "Please provide a valid search query.",
      });
    }

    // Determine which parameter to use for search
    let searchQuery: string;

    if (query) {
      searchQuery = query;
    } else if (firstName) {
      searchQuery = firstName;
    } else if (lastName) {
      searchQuery = lastName;
    } else if (username) {
      searchQuery = username;
    } else if (email) {
      searchQuery = email;
    } else {
      searchQuery = "";
    }

    // Proceed with searching users
    const users = await searchUsersInDB(searchQuery);

    if (!users.length) {
      return sendResponse({
        res,
        statusCode: HttpStatusCodes.NOT_FOUND,
        message: HttpResponseMessages.NOT_FOUND,
        data: "No users found matching your search query.",
      });
    }

    // If users are found, send them in the response
    logger.info("✅ Users retrieved successfully");
    sendResponse({
      res,
      statusCode: HttpStatusCodes.OK,
      message: HttpResponseMessages.SUCCESS,
      data: users,
    });
  } catch (error) {
    // Catch any errors and send an internal server error response
    logger.error("❌ Error searching users", error);
    sendResponse({
      res,
      statusCode: HttpStatusCodes.INTERNAL_SERVER_ERROR,
      message: HttpResponseMessages.INTERNAL_SERVER_ERROR,
      error,
    });
  }
};
