import express from "express";
import { authMiddleware, upload, validate } from "../services";
import {
  fetchUser,
  forgotPassword,
  getUserFollowersController,
  getUserFollowingController,
  getUserID,
  // getUserPosts,
  getUserProfile,
  getUserProfileWithPostStats,
  // getRepliesForUser,
  loginUser,
  logoutUser,
  register,
  resetPassword,
  searchUsers,
  submitNewPassword,
  toggleFollowUser,
  updateUser,
  uploadCoverPhoto,
  uploadProfilePic,
} from "../controllers";
import {
  forgotPasswordSchema,
  loginSchema,
  newPasswordSchema,
  registerSchema,
  resetPasswordSchema,
  searchUserSchema,
} from "../validations";

const router = express.Router();

router.post("/register", validate(registerSchema), register);
router.post("/login", validate(loginSchema), loginUser);
router.delete("/logout", logoutUser);

router.put("/update", authMiddleware, updateUser);

router.get("/", authMiddleware, fetchUser);
// Search users
router.get("/search", authMiddleware, validate(searchUserSchema), searchUsers);

router.post(
  "/upload/profile-picture",
  authMiddleware,
  upload.single("image"),
  uploadProfilePic
);
router.post(
  "/upload/cover-photo",
  authMiddleware,
  upload.single("image"),
  uploadCoverPhoto
);

// Get user profile
router.get("/profile", authMiddleware, getUserProfile);
router.get("/:userId", authMiddleware, getUserID);
router.get("/:userId/stats", authMiddleware, getUserProfileWithPostStats);

// Follow/Unfollow a user
router.put("/:userId/follow", authMiddleware, toggleFollowUser);
router.get("/:userId/following", authMiddleware, getUserFollowingController);
router.get("/:userId/followers", authMiddleware, getUserFollowersController);

// 🔐 New Routes for Password Management
router.put(
  "/reset-password",
  authMiddleware,
  validate(resetPasswordSchema),
  resetPassword
);
router.post("/forgot-password", validate(forgotPasswordSchema), forgotPassword);
router.post("/reset/:token", validate(newPasswordSchema), submitNewPassword);

export default router;
