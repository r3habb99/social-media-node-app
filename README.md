# Chat Node API

A social media/chat application backend built with Node.js, Express, TypeScript, MongoDB, and Socket.io.

## Features

- User management (authentication, profiles, following)
- Social interactions (posts, likes, retweets)
- Real-time messaging (individual and group chats)
- **🔒 End-to-End Message Encryption** (AES-256-GCM)
- Media handling (profile pictures, post media)
- Notifications
- Comprehensive API documentation

## Tech Stack

- **Backend**: Node.js, Express.js, TypeScript
- **Database**: MongoDB with Mongoose
- **Real-time Communication**: Socket.io
- **Authentication**: JWT (JSON Web Tokens)
- **Encryption**: AES-256-GCM (Node.js Crypto)
- **Validation**: Joi
- **Documentation**: Swagger/OpenAPI
- **File Upload**: Multer
- **Email**: Nodemailer
- **Logging**: Winston

## Project Structure

```
chat-node/
├── src/                      # Source code
│   ├── config/               # Configuration files
│   ├── constants/            # Application constants
│   ├── controllers/          # Request handlers
│   ├── db/                   # Database connection
│   ├── entities/             # MongoDB schema models
│   ├── interfaces/           # TypeScript interfaces
│   ├── middlewares/          # Express middlewares
│   ├── public/               # Static files
│   ├── queries/              # Database queries
│   ├── routes/               # API routes
│   ├── services/             # Business logic
│   ├── swagger/              # API documentation
│   │   ├── chatRoutes.ts     # Chat endpoints documentation
│   │   ├── config.ts         # Swagger base configuration
│   │   ├── index.ts          # Swagger setup
│   │   ├── messageRoutes.ts  # Message endpoints documentation
│   │   ├── notificationRoutes.ts # Notification endpoints documentation
│   │   ├── postRoutes.ts     # Post endpoints documentation
│   │   ├── schemas.ts        # Reusable schema components
│   │   └── userRoutes.ts     # User endpoints documentation
│   ├── validations/          # Request validation schemas
│   ├── app.ts                # Express app setup
│   ├── server.ts             # Server entry point
│   ├── socket.ts             # Socket.io setup
│   └── swagger.ts            # Swagger entry point
├── uploads/                  # Uploaded files
├── .env                      # Environment variables
├── package.json              # Dependencies and scripts
├── tsconfig.json             # TypeScript configuration
└── README.md                 # Project documentation
```

## Key Modules

- **User Module**: Authentication, profile management, following/followers
- **Chat Module**: Individual and group chats, chat management
- **Message Module**: Sending, editing, and deleting messages
- **Post Module**: Creating, liking, and retweeting posts
- **Notification Module**: User notifications

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- MongoDB
- npm or yarn

### Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/r3habb99/social-media-node-app.git
   cd chat-node
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Create a `.env` file in the root directory with the following variables:

   ```
   MONGO_URI=mongodb://localhost:27017/chat-node
   PORT=5050
   HOST=localhost
   NODE_ENV=development
   JWT_SECRET=your_jwt_secret
   JWT_EXPIRES_IN=7d
   ```

4. Start the development server:

   ```bash
   npm run dev
   ```

## API Documentation

The API is fully documented using Swagger/OpenAPI. To access the documentation:

1. Start the server:

   ```bash
   npm run dev
   ```

2. Open your browser and navigate to:

   ```
   http://localhost:5050/api-docs
   ```

3. The Swagger UI will display all available endpoints organized by modules:
   - User endpoints
   - Chat endpoints
   - Message endpoints
   - Post endpoints
   - Notification endpoints

4. You can test the endpoints directly from the Swagger UI:
   - For public endpoints, you can make requests immediately
   - For protected endpoints, you need to:
     1. Login using the `/api/user/login` endpoint to get a token
     2. Click the "Authorize" button at the top of the page
     3. Enter your token in the format: `Bearer your_token_here`
     4. Click "Authorize" to use the token for all subsequent requests

## 🔒 Message Encryption

All chat messages are automatically encrypted using **AES-256-GCM** encryption before being stored in the database.

### Quick Setup

1. Generate an encryption key:

   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```

2. Add to your `.env` file:

   ```bash
   MESSAGE_ENCRYPTION_KEY=your_generated_key_here
   ```

3. Restart the server - encryption is now active!

### How It Works

- **Saved to DB**: Messages are encrypted (unreadable)
- **Retrieved by users**: Messages are decrypted (human-readable)
- **Search**: Works on decrypted content
- **Backward compatible**: Supports both encrypted and non-encrypted messages

### Documentation

- **Quick Start**: See `QUICK_START_ENCRYPTION.md`
- **Full Guide**: See `docs/MESSAGE_ENCRYPTION.md`
- **Implementation**: See `docs/ENCRYPTION_IMPLEMENTATION_SUMMARY.md`

## Socket.io Events

The application uses Socket.io for real-time communication. Key events include:

- `connection`: When a user connects to the socket server
- `message`: When a new message is sent
- `typing`: When a user is typing in a chat
- `stopTyping`: When a user stops typing
- `notification`: When a user receives a notification

## Development

### Available Scripts

- `npm run dev`: Start the development server with hot-reload
- `npm run build`: Build the TypeScript code
- `npm start`: Start the production server

## License

[MIT](LICENSE)
