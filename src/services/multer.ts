import multer from "multer";
import path from "path";
import fs from "fs";
import { logger } from "./logger";

// Define base upload directory
const BASE_UPLOAD_DIR = path.join(__dirname, "../../uploads");

// Ensure base upload directory exists
if (!fs.existsSync(BASE_UPLOAD_DIR)) {
  logger.info(`Creating base upload directory: ${BASE_UPLOAD_DIR}`);
  fs.mkdirSync(BASE_UPLOAD_DIR, { recursive: true });
}

// Create subdirectories if they don't exist
const profilePicsDir = path.join(BASE_UPLOAD_DIR, "profile-pictures");
const coverPhotosDir = path.join(BASE_UPLOAD_DIR, "cover-photos");
const postMediaDir = path.join(BASE_UPLOAD_DIR, "post-media");

if (!fs.existsSync(profilePicsDir)) {
  logger.info(`Creating profile pictures directory: ${profilePicsDir}`);
  fs.mkdirSync(profilePicsDir, { recursive: true });
}

if (!fs.existsSync(coverPhotosDir)) {
  logger.info(`Creating cover photos directory: ${coverPhotosDir}`);
  fs.mkdirSync(coverPhotosDir, { recursive: true });
}

if (!fs.existsSync(postMediaDir)) {
  logger.info(`Creating post media directory: ${postMediaDir}`);
  fs.mkdirSync(postMediaDir, { recursive: true });
}

// Configure Multer storage dynamically
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let uploadFolder = "others"; // Default folder

    if (req.url.includes("profile-picture")) {
      uploadFolder = "profile-pictures";
    } else if (req.url.includes("cover-photo")) {
      uploadFolder = "cover-photos";
    } else if (req.originalUrl.includes("/post") && !req.originalUrl.includes("retweet") && !req.originalUrl.includes("like")) {
      uploadFolder = "post-media";
      logger.info("Detected post media upload");
    }

    const finalPath = path.join(BASE_UPLOAD_DIR, uploadFolder);

    // Log the destination path for debugging
    logger.info(`Upload destination path: ${finalPath}`);
    logger.info(`Request URL: ${req.url}`);
    logger.info(`Original URL: ${req.originalUrl}`);
    logger.info(`Upload folder selected: ${uploadFolder}`);
    logger.info(`File mimetype: ${file.mimetype}`);

    if (!fs.existsSync(finalPath)) {
      logger.info(`Creating directory: ${finalPath}`);
      fs.mkdirSync(finalPath, { recursive: true });
    }

    cb(null, finalPath);
  },
  filename: (req, file, cb) => {
    const uniqueFilename = `${Date.now()}-${file.originalname}`;

    // Store original and uploaded filenames in request body
    req.body.originalFileName = file.originalname;
    req.body.uploadedFileName = uniqueFilename;

    // Log filename details for debugging
    logger.info(`File: ${file.originalname}, Saved as: ${uniqueFilename}`);

    cb(null, uniqueFilename);
  },
});

const fileFilter = (
  _req: any,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  const allowedTypes = [
    "image/jpeg",
    "image/png",
    "image/jpg",
    "video/mp4",
    "video/quicktime",
    "video/x-msvideo",
  ];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new Error(
        "Only .jpg, .jpeg, .png, .mp4, .mov, and .avi formats are allowed!"
      )
    );
  }
};

export const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB max file size
});
