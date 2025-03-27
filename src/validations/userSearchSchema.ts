import Joi from "joi";

export const searchUserSchema = Joi.object({
  username: Joi.string().optional().trim().min(1).messages({
    "string.base": "Username must be a valid string",
    "string.empty": "Username cannot be empty",
    "string.min": "Username must be at least 1 character long",
  }),

  firstName: Joi.string().optional().trim().min(1).messages({
    "string.base": "First name must be a valid string",
    "string.empty": "First name cannot be empty",
    "string.min": "First name must be at least 1 character long",
  }),

  lastName: Joi.string().optional().trim().min(1).messages({
    "string.base": "Last name must be a valid string",
    "string.empty": "Last name cannot be empty",
    "string.min": "Last name must be at least 1 character long",
  }),

  email: Joi.string().optional().trim().email().messages({
    "string.base": "Email must be a valid string",
    "string.empty": "Email cannot be empty",
    "string.email": "Email must be a valid email address",
  }),
});
