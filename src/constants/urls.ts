/**
 * URL-related constants for the application
 * These constants are derived from environment variables
 */

// Import environment variables from config
import { HOST, PORT, NODE_ENV, CLIENT_URL } from "../config";

// Default values
const DEFAULT_HOST = 'localhost';
const DEFAULT_PORT = '5050';
const DEFAULT_CLIENT_PORT = '3000';

// Protocol based on environment
const PROTOCOL = NODE_ENV === 'production' ? 'https' : 'http';

// Server URL construction
const SERVER_HOST = HOST || DEFAULT_HOST;
const SERVER_PORT = PORT || DEFAULT_PORT;

// Base server URL (with or without port based on production status)
export const SERVER_BASE_URL = NODE_ENV === 'production'
  ? `${PROTOCOL}://${SERVER_HOST}`
  : `${PROTOCOL}://${SERVER_HOST}:${SERVER_PORT}`;

// API base URL
export const API_BASE_URL = `${SERVER_BASE_URL}/api`;

// Media URLs
export const UPLOADS_BASE_URL = `${SERVER_BASE_URL}/uploads`;
export const PROFILE_PICTURES_URL = `${UPLOADS_BASE_URL}/profile-pictures`;
export const COVER_PHOTOS_URL = `${UPLOADS_BASE_URL}/cover-photos`;
export const POST_MEDIA_URL = `${UPLOADS_BASE_URL}/post-media`;

// Client URLs
export const DEFAULT_CLIENT_URL = `${PROTOCOL}://${DEFAULT_HOST}:${DEFAULT_CLIENT_PORT}`;
export const CLIENT_BASE_URL = CLIENT_URL || DEFAULT_CLIENT_URL;

// Allowed origins for CORS
export const ALLOWED_ORIGINS = NODE_ENV === 'development'
  ? '*' // Allow all origins in development mode
  : [
      CLIENT_BASE_URL,
      SERVER_BASE_URL,
      // Add localhost variations
      'http://localhost:3000',
      'http://localhost:5050',
      // Add any other origins that need to be allowed
    ];

// Export a function to add custom origins (for dynamic configuration)
export const getAllowedOrigins = (additionalOrigins: string[] = []): string | string[] => {
  // If ALLOWED_ORIGINS is already a wildcard, return it
  if (ALLOWED_ORIGINS === '*') {
    return ALLOWED_ORIGINS;
  }

  // Otherwise, combine the arrays
  return [...ALLOWED_ORIGINS as string[], ...additionalOrigins];
};
