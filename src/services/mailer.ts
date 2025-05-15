import nodemailer from "nodemailer";
import { EMAIL_USER, EMAIL_PASS } from "../config";

export const sendResetPasswordEmail = async (
  email: string,
  resetLink: string
): Promise<void> => {
  const transporter = nodemailer.createTransport({
    service: "Gmail", // or any SMTP provider
    auth: {
      user: EMAIL_USER,
      pass: EMAIL_PASS,
    },
  });

  await transporter.sendMail({
    from: EMAIL_USER,
    to: email,
    subject: "Reset Your Password",
    html: `<p>You requested to reset your password.</p><p>Click <a href="${resetLink}">here</a> to reset.</p>`,
  });
};
