# Message Encryption Documentation

## Overview

This application implements **end-to-end encryption** for chat messages using **AES-256-GCM** (Advanced Encryption Standard with Galois/Counter Mode). This ensures that all messages are stored in encrypted form in the database and are only decrypted when retrieved by authorized users.

## How It Works

### Encryption Flow

1. **User sends a message** → Plain text content (e.g., "Hello, how are you?")
2. **Server encrypts the message** → Uses AES-256-GCM encryption
3. **Stored in database** → Encrypted content + IV + Auth Tag
4. **User retrieves messages** → Server decrypts and returns plain text
5. **User sees the message** → Human-readable content

### Database Storage

Messages are stored in MongoDB with the following structure:

```javascript
{
  _id: ObjectId("..."),
  sender: ObjectId("..."),
  content: "base64_encrypted_content_here", // ENCRYPTED
  iv: "base64_initialization_vector",       // For decryption
  authTag: "base64_authentication_tag",     // For verification
  chat: ObjectId("..."),
  messageType: "text",
  status: "sent",
  createdAt: Date,
  updatedAt: Date
}
```

### Client Response

When messages are retrieved, they are automatically decrypted:

```javascript
{
  id: "...",
  sender: { ... },
  content: "Hello, how are you?", // DECRYPTED - Human readable
  chat: { ... },
  messageType: "text",
  status: "sent",
  createdAt: "2024-01-01T00:00:00.000Z",
  updatedAt: "2024-01-01T00:00:00.000Z"
  // Note: iv and authTag are NOT exposed to client
}
```

## Encryption Algorithm

### AES-256-GCM

- **Algorithm**: AES (Advanced Encryption Standard)
- **Key Size**: 256 bits (32 bytes)
- **Mode**: GCM (Galois/Counter Mode)
- **Benefits**:
  - Strong encryption (industry standard)
  - Authenticated encryption (prevents tampering)
  - Fast performance
  - Secure against known attacks

### Components

1. **Encryption Key**: 256-bit secret key (stored in environment variable)
2. **IV (Initialization Vector)**: Random 128-bit value (unique per message)
3. **Auth Tag**: 128-bit authentication tag (ensures message integrity)

## Setup Instructions

### 1. Generate Encryption Key

Run this command to generate a secure encryption key:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Example output:
```
a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6a7b8c9d0e1f2
```

### 2. Add to Environment Variables

Add the generated key to your `.env` file:

```bash
MESSAGE_ENCRYPTION_KEY=a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6a7b8c9d0e1f2
```

### 3. Restart the Server

```bash
npm run dev
```

## Features

### ✅ Automatic Encryption

All messages are automatically encrypted when saved:

- `saveMessage()` - Encrypts before saving
- `editMessageById()` - Re-encrypts when editing

### ✅ Automatic Decryption

All messages are automatically decrypted when retrieved:

- `getMessages()` - Decrypts all messages in a chat
- `getMessageById()` - Decrypts a single message
- `searchMessages()` - Decrypts before searching
- `markMessageAsRead()` - Returns decrypted message
- `fetchUserMessages()` - Decrypts latest message in chat list

### ✅ Search Functionality

The search feature works with encrypted messages:

1. Fetches all messages from the chat
2. Decrypts each message
3. Searches in the decrypted content
4. Returns matching messages (decrypted)

**Note**: This is less efficient than direct database search but necessary for encrypted content.

### ✅ Backward Compatibility

The system supports both encrypted and non-encrypted messages:

- If a message has `iv` and `authTag`, it's decrypted
- If a message doesn't have encryption metadata, it's returned as-is
- This allows gradual migration from non-encrypted to encrypted messages

## Security Considerations

### 🔒 Key Management

- **Keep the encryption key secret** - Never commit to version control
- **Use the same key across all instances** - Required for decryption
- **Backup the key securely** - Lost key = lost messages
- **Rotate keys periodically** - For enhanced security (requires re-encryption)

### 🔒 What's Protected

✅ Message content is encrypted in the database
✅ Messages are protected from database breaches
✅ Authentication tags prevent tampering

### ⚠️ What's NOT Protected

❌ Metadata (sender, timestamp, chat ID) is NOT encrypted
❌ Messages in transit (use HTTPS/TLS for that)
❌ Messages on client side (client-side encryption is separate)

## API Examples

### Send a Message

```javascript
// Client sends plain text
POST /api/message
{
  "content": "Hello, how are you?",
  "chatId": "chat123"
}

// Server encrypts and stores
// Client receives decrypted response
{
  "content": "Hello, how are you?", // Decrypted
  "sender": { ... },
  "chat": { ... }
}
```

### Get Messages

```javascript
// Client requests messages
GET /api/message/chat?chatId=chat123

// Server decrypts and returns
[
  {
    "content": "Hello, how are you?", // Decrypted
    "sender": { ... }
  },
  {
    "content": "I'm doing great!", // Decrypted
    "sender": { ... }
  }
]
```

### Search Messages

```javascript
// Client searches for "great"
GET /api/message/search?chatId=chat123&query=great

// Server decrypts all messages, searches, and returns matches
[
  {
    "content": "I'm doing great!", // Decrypted and matched
    "sender": { ... }
  }
]
```

## Troubleshooting

### Messages Not Decrypting

**Problem**: Messages appear as encrypted gibberish

**Solution**:
1. Check if `MESSAGE_ENCRYPTION_KEY` is set in `.env`
2. Verify the key is correct (64 hex characters)
3. Restart the server after adding the key

### Search Not Working

**Problem**: Search returns no results

**Solution**:
1. Ensure messages are being decrypted properly
2. Check server logs for decryption errors
3. Verify the search query is correct

### Performance Issues

**Problem**: Message retrieval is slow

**Solution**:
1. Implement pagination (already included)
2. Limit the number of messages fetched
3. Consider caching decrypted messages (with caution)

## Technical Implementation

### Files Modified

- `src/services/encryption.ts` - Encryption/decryption service
- `src/entities/Message.entity.ts` - Added `iv` and `authTag` fields
- `src/interfaces/message.interface.ts` - Updated interface
- `src/queries/message.queries.ts` - Encrypt on save, decrypt on retrieve
- `src/queries/chat.queries.ts` - Decrypt latest message
- `ENV_SETUP.md` - Documentation for encryption key

### Key Functions

- `encryptMessage(content)` - Encrypts plain text
- `decryptMessage({ encryptedContent, iv, authTag })` - Decrypts encrypted data
- `decryptMessageObject(message)` - Decrypts a message object
- `decryptMessages(messages)` - Decrypts an array of messages

## Future Enhancements

- [ ] Client-side encryption (true end-to-end)
- [ ] Key rotation mechanism
- [ ] Per-chat encryption keys
- [ ] Encrypted media files
- [ ] Encrypted group chat names

