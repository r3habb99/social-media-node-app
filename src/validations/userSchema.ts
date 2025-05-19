import Joi from "joi";

export const registerSchema = Joi.object({
  firstName: Joi.string().min(2).max(50).required().messages({
    "string.base": "First name must be a string.",
    "string.empty": "First name is required.",
    "string.min": "First name must be at least 2 characters long.",
    "string.max": "First name must not exceed 50 characters.",
    "any.required": "First name is required.",
  }),

  lastName: Joi.string().min(2).max(50).required().messages({
    "string.base": "Last name must be a string.",
    "string.empty": "Last name is required.",
    "string.min": "Last name must be at least 2 characters long.",
    "string.max": "Last name must not exceed 50 characters.",
    "any.required": "Last name is required.",
  }),

  username: Joi.string().alphanum().min(3).max(30).required().messages({
    "string.base": "Username must be a string.",
    "string.empty": "Username is required.",
    "string.alphanum": "Username must only contain alphanumeric characters.",
    "string.min": "Username must be at least 3 characters long.",
    "string.max": "Username must not exceed 30 characters.",
    "any.required": "Username is required.",
  }),

  email: Joi.string().email().required().messages({
    "string.base": "Email must be a string.",
    "string.empty": "Email is required.",
    "string.email": "Please provide a valid email address.",
    "any.required": "Email is required.",
  }),

  password: Joi.string()
    .min(5) // Minimum length set to 5 characters
    .max(20)
    .pattern(
      new RegExp(
        "^(?=.*[A-Z])(?=.*[a-z])(?=.*[0-9])(?=.*[@$!%*?&])[A-Za-z0-9@$!%*?&]{5,20}$" // Updated regex to allow 5 characters minimum and enforce required criteria
      )
    )
    .required()
    .messages({
      "string.base": "Password must be a string.",
      "string.empty": "Password is required.",
      "string.min": "Password must be at least 5 characters long.",
      "string.max": "Password must not exceed 20 characters.",
      "string.pattern.base":
        "Password must be at least 5 characters long and contain uppercase, lowercase, number, and special character.",
      "any.required": "Password is required.",
    }),
});

export const loginSchema = Joi.object({
  email: Joi.string().email().messages({
    "string.base": "Email must be a string.",
    "string.email": "Please provide a valid email address.",
  }),

  username: Joi.string().alphanum().min(3).max(30).messages({
    "string.base": "Username must be a string.",
    "string.alphanum": "Username must only contain alphanumeric characters.",
    "string.min": "Username must be at least 3 characters long.",
    "string.max": "Username must not exceed 30 characters.",
  }),

  password: Joi.string().required().messages({
    "string.base": "Password must be a string.",
    "string.empty": "Password is required.",
    "any.required": "Password is required.",
  }),
})
.custom((value, helpers) => {
  // Check if at least one of email or username is provided
  if (!value.email && !value.username) {
    return helpers.error('object.missing', {
      message: 'Either email or username is required'
    });
  }
  return value;
}, 'Email or Username Validation');

export const updateUserSchema = Joi.object({
  firstName: Joi.string().min(2).max(50).optional().messages({
    "string.base": "First name must be a string.",
    "string.min": "First name must be at least 2 characters long.",
    "string.max": "First name must not exceed 50 characters.",
  }),

  lastName: Joi.string().min(2).max(50).optional().messages({
    "string.base": "Last name must be a string.",
    "string.min": "Last name must be at least 2 characters long.",
    "string.max": "Last name must not exceed 50 characters.",
  }),

  username: Joi.string().alphanum().min(3).max(30).optional().messages({
    "string.base": "Username must be a string.",
    "string.alphanum": "Username must only contain alphanumeric characters.",
    "string.min": "Username must be at least 3 characters long.",
    "string.max": "Username must not exceed 30 characters.",
  }),

  email: Joi.string().email().optional().messages({
    "string.base": "Email must be a string.",
    "string.email": "Please provide a valid email address.",
  }),

  bio: Joi.string().max(160).optional().messages({
    "string.base": "Bio must be a string.",
    "string.max": "Bio cannot exceed 160 characters.",
  }),
})
.min(1) // Require at least one field to be present
.messages({
  "object.min": "At least one field must be provided for update",
});
