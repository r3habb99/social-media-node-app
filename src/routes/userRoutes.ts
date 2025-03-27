import express from "express";
import { authMiddleware, validate } from "../services";
import { loginUser, logoutUser, register, searchUsers } from "../controllers";
import { loginSchema, registerSchema, searchUserSchema } from "../validations";

const router = express();

router.post("/register", validate(registerSchema), register);
router.post("/login", validate(loginSchema), loginUser);
router.delete("/logout", authMiddleware, logoutUser);

// Search users
router.get("/search", authMiddleware, validate(searchUserSchema), searchUsers);

export default router;
