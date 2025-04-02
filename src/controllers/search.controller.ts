import { Request, Response } from "express";
import { logger, sendResponse } from "../services";
import { HttpResponseMessages, HttpStatusCodes } from "../constants";
import { searchUsersInDB } from "../queries";

export const searchUsers = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    // Retrieve the 'query' parameter from the request
    const { query } = req.query; // Extract 'query' from query parameters

    if (!query || typeof query !== "string" || query.trim() === "") {
      // If no query is provided, send a bad request response
      return sendResponse({
        res,
        statusCode: HttpStatusCodes.BAD_REQUEST,
        message: HttpResponseMessages.BAD_REQUEST,
        data: "Please provide a valid search query.",
      });
    }

    // Proceed with searching users
    const users = await searchUsersInDB(query);

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
