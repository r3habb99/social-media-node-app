# Environment Variables and Development Setup

This document explains how to use environment variables in the Chat Node application and how to switch between development and production modes.

## Table of Contents

- [Environment Variables](#environment-variables)
- [URL Constants](#url-constants)
- [Development and Production Modes](#development-and-production-modes)
- [Available Scripts](#available-scripts)
- [CORS Configuration](#cors-configuration)

## Environment Variables

The application uses environment variables for configuration. These are defined in the `.env` file in the root directory.

### Required Environment Variables

```
# MongoDB Environment Variables
MONGO_URI="mongodb://localhost:27017/chat-app"

# JWT Secret Key
JWT_SECRET="your_secret_key"
JWT_EXPIRES_IN=1d

# Server Configuration
PORT=5050
HOST=localhost
NODE_ENV=development
SERVER_URL=http://localhost:5050

# Email Configuration
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_email_password
CLIENT_URL=http://localhost:3000
```

### How Environment Variables are Used

Environment variables are imported in the application through the `src/config/index.ts` file:

```typescript
import { config } from "dotenv";
config({ path: ".env" });
export const {
  MONGO_URI,
  SERVER_URL,
  PORT,
  HOST,
  NODE_ENV,
  JWT_SECRET,
  JWT_EXPIRES_IN,
  CLIENT_URL,
  EMAIL_USER,
  EMAIL_PASS
} = process.env;
```

## URL Constants

To avoid hardcoded URLs throughout the application, we've created a centralized file for URL-related constants at `src/constants/urls.ts`. This file exports various URL constants derived from environment variables:

```typescript
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
```

### Using URL Constants

Instead of hardcoding URLs in your code, import and use these constants:

```typescript
import { SERVER_BASE_URL, PROFILE_PICTURES_URL } from "../constants/urls";

// Example usage
const profilePicUrl = `${PROFILE_PICTURES_URL}/user123.jpg`;
```

## Development and Production Modes

The application behavior changes based on the `NODE_ENV` environment variable.

### Differences Between Modes

| Feature | Development Mode | Production Mode |
|---------|------------------|----------------|
| CORS | Allows all origins (`*`) | Restricts to specific origins |
| Error Details | Shows detailed errors | Shows generic error messages |
| URLs | Includes port number | May exclude port in production |
| Logging | More verbose | More concise |

### Switching Between Modes

You can switch between development and production modes in several ways:

1. **Using .env file**:
   ```
   NODE_ENV=development
   ```
   or
   ```
   NODE_ENV=production
   ```

2. **Using npm scripts** (recommended):
   ```bash
   # For development
   npm run dev
   
   # For production
   npm run build:prod
   ```

## Available Scripts

The following npm scripts are available:

- `npm start`: Run the compiled JavaScript code
- `npm run dev`: Run in development mode with nodemon
- `npm run dev:watch`: Run TypeScript compiler in watch mode and nodemon simultaneously
- `npm run build`: Compile TypeScript to JavaScript
- `npm run prod`: Run compiled code in production mode
- `npm run build:prod`: Compile and run in production mode
- `npm run watch`: Run TypeScript compiler in watch mode

### Development Workflow

For the best development experience, use:

```bash
npm run dev:watch
```

This will:
1. Watch for changes in your TypeScript files and recompile them
2. Automatically restart the server when changes are detected
3. Run in development mode with all development features enabled

### Production Deployment

For production deployment, use:

```bash
npm run build:prod
```

This will:
1. Compile your TypeScript code to JavaScript
2. Run the application in production mode

## CORS Configuration

CORS (Cross-Origin Resource Sharing) is configured differently based on the environment:

### Development Mode

In development mode, all origins are allowed:

```typescript
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
```

### Production Mode

In production mode, only specific origins are allowed. To add more allowed origins, update the array in `src/constants/urls.ts`.

### Special Routes

The `/uploads` route has special CORS handling to ensure media files can be accessed from different origins:

```typescript
app.use("/uploads", (req, res, next) => {
  // Set comprehensive CORS headers
  res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
  
  // Set Access-Control-Allow-Origin based on the request origin
  const origin = req.headers.origin;
  if (origin && ALLOWED_ORIGINS.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  } else {
    // Fallback to the first allowed origin
    res.setHeader('Access-Control-Allow-Origin', ALLOWED_ORIGINS[0]);
  }
  
  // Other CORS headers...
  next();
}, express.static(path.join(__dirname, "../uploads")));
```

## Conclusion

By using environment variables and the URL constants system, the application is now more configurable and maintainable. The separation between development and production modes makes it easier to develop and deploy the application.
