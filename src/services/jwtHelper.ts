import jwt, { SignOptions } from "jsonwebtoken";
import { JWT_EXPIRES_IN, JWT_SECRET } from "../config";

interface JwtPayload {
  id: string;
  firstName: string;
  email: string;
  username: string;
  userType: number;
}

// Function to generate a JWT token
export const generateToken = (user: JwtPayload): string => {
  if (!JWT_SECRET) {
    throw new Error("JWT_SECRET is not defined in environment variables");
  }

  if (!JWT_EXPIRES_IN) {
    throw new Error("JWT_EXPIRES_IN is not defined in environment variables");
  }

  return jwt.sign(user, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN as SignOptions["expiresIn"], // Ensure correct type
  });
};

// Function to verify a JWT token
export const verifyToken = (
  token: string,
  secret: string
): JwtPayload | null => {
  try {
    const decoded = jwt.verify(token, secret) as JwtPayload;
    return decoded;
  } catch (error) {
    console.error("JWT verification error:", error);
    return null; // Return null if the token is invalid or expired
  }
};
