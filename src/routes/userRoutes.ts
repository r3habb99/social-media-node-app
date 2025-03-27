import express from "express";
import {
  register,
  loginUser,
  logoutUser,
} from "../controllers/user.controller";
import { authMiddleware, validate } from "../services";
import { loginSchema, registerSchema } from "../validations/userSchema";

const router = express();

router.post("/register", validate(registerSchema), register);
router.post("/login", validate(loginSchema), loginUser);
router.delete("/logout", authMiddleware, logoutUser);

export default router;
