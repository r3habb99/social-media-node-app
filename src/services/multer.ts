import multer from "multer";
import path from "path";
import fs from "fs";
import { logger } from "./logger";

// Define base upload directory
const BASE_UPLOAD_DIR = path.join(__dirname, "../../uploads");

if (!fs.existsSync(BASE_UPLOAD_DIR)) {
  fs.mkdirSync(BASE_UPLOAD_DIR, { recursive: true });
}

// Configure Multer storage dynamically
const storage = multer.diskStorage({
  destination: (req, _file, cb) => {
    let uploadFolder = "others"; // Default folder

    if (req.url.includes("profile-picture")) {
      uploadFolder = "profile-pictures";
    } else if (req.url.includes("cover-photo")) {
      uploadFolder = "cover-photos";
    }

    const finalPath = path.join(BASE_UPLOAD_DIR, uploadFolder);
    if (!fs.existsSync(finalPath)) {
      fs.mkdirSync(finalPath, { recursive: true });
    }

    cb(null, finalPath);
  },
  filename: (req, file, cb) => {
    const uniqueFilename = `${Date.now()}-${file.originalname}`;

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
