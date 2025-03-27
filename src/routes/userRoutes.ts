import express from "express";
import {
  register,
  loginUser,
  logoutUser,
} from "../controllers/user.controller";
import { authMiddleware, validate } from "../services";
import { loginSchema, registerSchema } from "../validations/userSchema";

const app = express();

app.post("/register", validate(registerSchema), register);
app.post("/login", validate(loginSchema), loginUser);
app.delete("/logout", authMiddleware, logoutUser);

export default app;
