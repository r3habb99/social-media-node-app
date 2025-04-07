import Joi from "joi";

export const resetPasswordSchema = Joi.object({
  oldPassword: Joi.string().required().messages({
    "any.required": "Old password is required",
    "string.empty": "Old password cannot be empty",
  }),
  newPassword: Joi.string()
    .min(5)
    .max(20)
    .pattern(
      new RegExp(
        "^(?=.*[A-Z])(?=.*[a-z])(?=.*[0-9])(?=.*[@$!%*?&])[A-Za-z0-9@$!%*?&]{5,20}$"
      )
    )
    .required()
    .messages({
      "any.required": "New password is required",
      "string.min": "New password must be at least 6 characters long", // update this if needed
      "string.empty": "New password cannot be empty",
    }),
  confirmPassword: Joi.string()
    .valid(Joi.ref("newPassword"))
    .required()
    .messages({
      "any.only": "Confirm password must match new password",
      "any.required": "Confirm password is required",
      "string.empty": "Confirm password cannot be empty",
    }),
});

export const forgotPasswordSchema = Joi.object({
  email: Joi.string().email().required().messages({
    "string.email": "Please enter a valid email address",
    "any.required": "Email is required",
    "string.empty": "Email cannot be empty",
  }),
});

export const newPasswordSchema = Joi.object({
  newPassword: Joi.string()
    .min(5) // Minimum length set to 5 characters
    .max(20)
    .pattern(
      new RegExp(
        "^(?=.*[A-Z])(?=.*[a-z])(?=.*[0-9])(?=.*[@$!%*?&])[A-Za-z0-9@$!%*?&]{5,20}$" // Updated regex to allow 5 characters minimum and enforce required criteria
      )
    )
    .required()
    .messages({
      "any.required": "New password is required",
      "string.min": "New password must be at least 6 characters long",
      "string.empty": "New password cannot be empty",
    }),
  confirmPassword: Joi.string()
    .valid(Joi.ref("newPassword"))
    .required()
    .messages({
      "any.only": "Confirm password must match new password",
      "any.required": "Confirm password is required",
      "string.empty": "Confirm password cannot be empty",
    }),
});
