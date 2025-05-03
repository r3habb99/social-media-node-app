import { Request, Response, NextFunction } from "express";
import Joi from "joi";
import { logger, sendResponse } from "../services";
import { HttpStatusCodes } from "../constants";

/**
 * Middleware to validate request body against a Joi schema
 * @param schema - Joi schema to validate against
 * @param property - Request property to validate (body, params, query)
 */
export const validateRequest = (
  schema: Joi.ObjectSchema,
  property: "body" | "params" | "query" = "body"
) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const { error } = schema.validate(req[property], {
      abortEarly: false, // Include all errors
      allowUnknown: true, // Ignore unknown props
      stripUnknown: true, // Remove unknown props
    });

    if (error) {
      const validationErrors = error.details.map((detail) => detail.message);
      logger.error(`Validation error: ${validationErrors.join(", ")}`);
      
      return sendResponse({
        res,
        statusCode: HttpStatusCodes.BAD_REQUEST,
        message: "Validation Error",
        error: validationErrors,
      });
    }

    next();
  };
};
