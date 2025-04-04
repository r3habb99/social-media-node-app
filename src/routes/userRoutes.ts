import express from "express";
import { authMiddleware, upload, validate } from "../services";
import {
  getUserFollowersController,
  getUserFollowingController,
  getUserProfile,
  loginUser,
  logoutUser,
  register,
  searchUsers,
  toggleFollowUser,
  updateUser,
  uploadCoverPhoto,
  uploadProfilePic,
} from "../controllers";
import { loginSchema, registerSchema, searchUserSchema } from "../validations";

const router = express();

router.post("/register", validate(registerSchema), register);
router.post("/login", validate(loginSchema), loginUser);
router.delete("/logout", authMiddleware, logoutUser);

router.put("/update", authMiddleware, updateUser);

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

// Follow/Unfollow a user
router.put("/:userId/follow", authMiddleware, toggleFollowUser);
router.get("/:userId/following", authMiddleware, getUserFollowingController);
router.get("/:userId/followers", authMiddleware, getUserFollowersController);

export default router;
