import { HOST, PORT } from "../config";

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

  // Get the backend URL from environment variables
  const protocol = process.env.NODE_ENV === 'production' ? 'https' : 'http';
  const host = HOST || 'localhost';
  const port = PORT || '5050';

  // For production, you might not want to include the port in the URL
  const baseUrl = process.env.NODE_ENV === 'production'
    ? `${protocol}://${host}`
    : `${protocol}://${host}:${port}`;

  // Ensure the relativePath starts with a slash and doesn't include /api
  let path = relativePath.startsWith('/') ? relativePath : `/${relativePath}`;

  // Remove /api prefix if it exists
  if (path.startsWith('/api/')) {
    path = path.substring(4); // Remove the /api prefix
  }

  return `${baseUrl}${path}`;
};
