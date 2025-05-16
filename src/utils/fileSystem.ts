import fs from 'fs';
import path from 'path';
import { logger } from '../services';

/**
 * Deletes a file from the filesystem
 * @param filePath - The relative path of the file to delete (e.g., /uploads/profile-pictures/image.jpg)
 * @returns A boolean indicating whether the deletion was successful
 */
export const deleteFile = (filePath: string): boolean => {
  try {
    // If the path is a full URL, extract just the path part
    if (filePath.startsWith('http://') || filePath.startsWith('https://')) {
      const url = new URL(filePath);
      filePath = url.pathname;
    }

    // Remove any leading /api prefix if it exists
    if (filePath.startsWith('/api/')) {
      filePath = filePath.substring(4);
    }

    // Ensure the path starts with a slash
    if (!filePath.startsWith('/')) {
      filePath = `/${filePath}`;
    }

    // Convert relative path to absolute path
    const absolutePath = path.join(process.cwd(), filePath);
    
    logger.info(`Attempting to delete file at: ${absolutePath}`);

    // Check if file exists before attempting to delete
    if (!fs.existsSync(absolutePath)) {
      logger.warn(`File does not exist at path: ${absolutePath}`);
      return false;
    }

    // Delete the file
    fs.unlinkSync(absolutePath);
    logger.info(`Successfully deleted file at: ${absolutePath}`);
    return true;
  } catch (error) {
    logger.error(`Error deleting file at ${filePath}:`, error);
    return false;
  }
};

/**
 * Checks if a file path is a default asset that should not be deleted
 * @param filePath - The path to check
 * @returns True if the path is a default asset, false otherwise
 */
export const isDefaultAsset = (filePath: string): boolean => {
  if (!filePath) return true;
  
  // Check if the path points to a default asset in the public directory
  return filePath.includes('/public/assets/');
};
