import express from "express";
import {
  register,
  loginUser,
  logoutUser,
} from "../controllers/user.controller";
import { authMiddleware } from "../services";

const app = express();

app.post("/register", register);
app.post("/login", loginUser);
app.delete("/logout", authMiddleware, logoutUser);

export default app;
