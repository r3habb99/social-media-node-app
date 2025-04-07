import nodemailer from "nodemailer";

export const sendResetPasswordEmail = async (
  email: string,
  resetLink: string
): Promise<void> => {
  const transporter = nodemailer.createTransport({
    service: "Gmail", // or any SMTP provider
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to: email,
    subject: "Reset Your Password",
    html: `<p>You requested to reset your password.</p><p>Click <a href="${resetLink}">here</a> to reset.</p>`,
  });
};
