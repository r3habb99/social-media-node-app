import express from "express";
import { authMiddleware, upload, validate } from "../services";
import { getUserProfile, loginUser, logoutUser, register, searchUsers, uploadProfilePic } from "../controllers";
import { loginSchema, registerSchema, searchUserSchema } from "../validations";

const router = express();

router.post("/register", validate(registerSchema), register);
router.post("/login", validate(loginSchema), loginUser);
router.delete("/logout", authMiddleware, logoutUser);

// Search users
router.get("/search", authMiddleware, validate(searchUserSchema), searchUsers);

// Upload profile picture
router.post("/upload-profile-pic", authMiddleware, upload.single("profilePic"), uploadProfilePic);

// Get user profile
router.get("/profile", authMiddleware, getUserProfile);

export default router;
