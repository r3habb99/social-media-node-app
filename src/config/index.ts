import { config } from "dotenv";
config({ path: ".env" });
export const { MONGO_URI, PORT, HOST, NODE_ENV, JWT_SECRET, JWT_EXPIRES_IN } =
  process.env;
