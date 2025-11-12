import nodemailer from "nodemailer";
import { EMAIL_USER, EMAIL_PASS, CLIENT_URL } from "../config";
import { logger } from "./logger";

// Validate email configuration on startup
const validateEmailConfig = (): boolean => {
  if (!EMAIL_USER || !EMAIL_PASS) {
    logger.error("❌ Email configuration missing: EMAIL_USER and EMAIL_PASS are required");
    return false;
  }

  // Basic email format validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(EMAIL_USER)) {
    logger.error("❌ Invalid EMAIL_USER format");
    return false;
  }

  return true;
};

// Create transporter with better error handling
const createTransporter = () => {
  if (!validateEmailConfig()) {
    throw new Error("Invalid email configuration");
  }

  return nodemailer.createTransport({
    service: "Gmail",
    auth: {
      user: EMAIL_USER,
      pass: EMAIL_PASS,
    },
    // Add additional options for better reliability
    pool: true,
    maxConnections: 5,
    maxMessages: 100,
  });
};

// Enhanced password reset email template
const getPasswordResetEmailTemplate = (resetLink: string): string => {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Reset Your Password</title>
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #007bff; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; background-color: #f9f9f9; }
            .button { display: inline-block; padding: 12px 24px; background-color: #007bff; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .footer { padding: 20px; text-align: center; font-size: 12px; color: #666; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>Password Reset Request</h1>
            </div>
            <div class="content">
                <p>Hello,</p>
                <p>You have requested to reset your password for your Social Media account.</p>
                <p>Click the button below to reset your password:</p>
                <a href="${resetLink}" class="button">Reset Password</a>
                <p>If the button doesn't work, you can copy and paste this link into your browser:</p>
                <p><a href="${resetLink}">${resetLink}</a></p>
                <p><strong>Important:</strong> This link will expire in 1 hour for security reasons.</p>
                <p>If you didn't request this password reset, please ignore this email.</p>
            </div>
            <div class="footer">
                <p>© 2024 Social Media App. All rights reserved.</p>
                <p>This is an automated email, please do not reply.</p>
            </div>
        </div>
    </body>
    </html>
  `;
};

export const sendResetPasswordEmail = async (
  email: string,
  resetLink: string
): Promise<void> => {
  try {
    logger.info(`📧 Attempting to send password reset email to: ${email}`);

    const transporter = createTransporter();

    // Verify transporter configuration
    await transporter.verify();
    logger.info("✅ Email transporter verified successfully");

    const mailOptions = {
      from: {
        name: "Social Media App",
        address: EMAIL_USER!,
      },
      to: email,
      subject: "Reset Your Password - Social Media App",
      html: getPasswordResetEmailTemplate(resetLink),
      // Add text version for better compatibility
      text: `
        Password Reset Request

        You have requested to reset your password for your Social Media account.

        Click this link to reset your password: ${resetLink}

        This link will expire in 1 hour for security reasons.

        If you didn't request this password reset, please ignore this email.

        © 2024 Social Media App. All rights reserved.
      `,
    };

    const result = await transporter.sendMail(mailOptions);
    logger.info(`✅ Password reset email sent successfully to ${email}. Message ID: ${result.messageId}`);

  } catch (error) {
    logger.error(`❌ Failed to send password reset email to ${email}:`, error);

    // Provide more specific error messages
    if (error instanceof Error) {
      if (error.message.includes("Invalid login")) {
        throw new Error("Email service authentication failed. Please check EMAIL_USER and EMAIL_PASS configuration.");
      } else if (error.message.includes("Network")) {
        throw new Error("Network error occurred while sending email. Please try again later.");
      } else {
        throw new Error(`Email sending failed: ${error.message}`);
      }
    }

    throw new Error("Unknown error occurred while sending email");
  }
};
