import Joi from "joi";
import { Request, Response, NextFunction } from "express";
import { logger } from "./logger";
import { HttpStatusCodes, ErrorMessageCodes } from "../constants";
import { sendResponse } from "./responseHelper";

// Custom error logging function
const logValidationError = (error: Joi.ValidationError, req: Request) => {
  const errorDetails = error.details.map((detail) => ({
    message: detail.message,
    path: detail.path.join("."), // Ensure proper formatting
    type: detail.type,
  }));

  logger.error("Validation Error:", {
    method: req.method,
    url: req.originalUrl,
    errors: errorDetails,
  });

  return errorDetails;
};

export const validate =
  (schema: Joi.ObjectSchema, property: "body" | "params" | "query" = "body") =>
  (req: Request, res: Response, next: NextFunction): void => {
    const { error } = schema.validate(req[property], {
      abortEarly: false, // Validate all properties
      allowUnknown: false, // Reject extra properties
      convert: true, // Convert types where necessary
    });

    if (error) {
      const errorMessages = error.details.map((detail) => ({
        message: detail.message,
        path: detail.path.join("."), // Properly format path
        type: detail.type,
      }));

      logger.error("Validation Error:", {
        method: req.method,
        url: req.originalUrl,
        errors: errorMessages,
      });

      sendResponse({
        statusCode: HttpStatusCodes.BAD_REQUEST,
        res,
        message: ErrorMessageCodes.INVALID_REQUEST,
        error: errorMessages, // Now properly sending validation errors
      });

      return;
    }

    next();
  };
