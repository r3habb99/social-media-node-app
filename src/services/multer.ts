import multer from "multer";
import path from "path";
import fs from "fs";
import { logger } from "./logger";

// Define base upload directory
const BASE_UPLOAD_DIR = path.join(__dirname, "../../uploads");

// Ensure base directory exists
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

    // Ensure the specific upload folder exists
    if (!fs.existsSync(finalPath)) {
      fs.mkdirSync(finalPath, { recursive: true });
    }

    cb(null, finalPath);
  },
  filename: (req, file, cb) => {
    const uniqueFilename = `${Date.now()}-${file.originalname}`; // Generate unique file name

    // Attach original and unique file names to the request object
    req.body.originalFileName = file.originalname;
    req.body.uploadedFileName = uniqueFilename;

    logger.info(`Original: ${file.originalname}, Saved: ${uniqueFilename}`);

    cb(null, uniqueFilename);
  },
});

// File filter to allow only images
const fileFilter = (
  _req: any,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  console.log(file); // Debugging line
  console.log("Uploaded File MIME Type:", file.mimetype); // Debugging line

  const allowedTypes = [
    "image/jpeg",
    "image/png",
    "image/jpg",
    "video/mp4",
    "video/quicktime", // For .mov files
    "video/x-msvideo", // For .avi files
  ];
  console.log(allowedTypes); // Debugging line
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    console.log("Rejected File Type:", file.mimetype); // Debugging line
    cb(
      new Error(
        "Only .jpg, .jpeg, .png, .mp4, .mov, and .avi formats are allowed!"
      )
    );
  }
};

// Multer instance
export const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB max file size
});
