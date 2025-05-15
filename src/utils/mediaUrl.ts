import { SERVER_BASE_URL } from "../constants/urls";

/**
 * Generates a full URL for media files
 * @param relativePath - The relative path of the media file (e.g., /uploads/post-media/image.jpg)
 * @returns The full URL including the backend host and port
 */
export const getFullMediaUrl = (relativePath: string): string => {
  // If the path is already a full URL, return it as is
  if (relativePath.startsWith('http://') || relativePath.startsWith('https://')) {
    return relativePath;
  }

  // Ensure the relativePath starts with a slash and doesn't include /api
  let path = relativePath.startsWith('/') ? relativePath : `/${relativePath}`;

  // Remove /api prefix if it exists
  if (path.startsWith('/api/')) {
    path = path.substring(4); // Remove the /api prefix
  }

  return `${SERVER_BASE_URL}${path}`;
};
