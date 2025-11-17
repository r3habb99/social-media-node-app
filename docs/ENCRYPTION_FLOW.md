# Message Encryption Flow Diagram

## Complete Flow: Send & Retrieve Message

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         SENDING A MESSAGE                                │
└─────────────────────────────────────────────────────────────────────────┘

   Client                    Server                    Database
     │                         │                           │
     │  POST /api/message      │                           │
     │  {                      │                           │
     │    content: "Hello!"    │                           │
     │  }                      │                           │
     ├────────────────────────>│                           │
     │                         │                           │
     │                         │ 1. Encrypt content        │
     │                         │    using AES-256-GCM      │
     │                         │    - Generate random IV   │
     │                         │    - Encrypt "Hello!"     │
     │                         │    - Get auth tag         │
     │                         │                           │
     │                         │  2. Save to database      │
     │                         │  {                        │
     │                         │    content: "U2Fsd...",   │ (encrypted)
     │                         │    iv: "a1b2c3...",       │
     │                         │    authTag: "m3n4o5..."   │
     │                         │  }                        │
     │                         ├──────────────────────────>│
     │                         │                           │
     │                         │  3. Decrypt for response  │
     │                         │     (client gets plain)   │
     │                         │                           │
     │  Response:              │                           │
     │  {                      │                           │
     │    content: "Hello!"    │ (decrypted)               │
     │  }                      │                           │
     │<────────────────────────┤                           │
     │                         │                           │


┌─────────────────────────────────────────────────────────────────────────┐
│                       RETRIEVING MESSAGES                                │
└─────────────────────────────────────────────────────────────────────────┘

   Client                    Server                    Database
     │                         │                           │
     │  GET /api/message/chat  │                           │
     │  ?chatId=123            │                           │
     ├────────────────────────>│                           │
     │                         │                           │
     │                         │  1. Fetch from database   │
     │                         │<──────────────────────────┤
     │                         │  [                        │
     │                         │    {                      │
     │                         │      content: "U2Fsd...", │ (encrypted)
     │                         │      iv: "a1b2c3...",     │
     │                         │      authTag: "m3n4o5..." │
     │                         │    }                      │
     │                         │  ]                        │
     │                         │                           │
     │                         │  2. Decrypt each message  │
     │                         │     using IV & auth tag   │
     │                         │                           │
     │  Response:              │                           │
     │  [                      │                           │
     │    {                    │                           │
     │      content: "Hello!"  │ (decrypted)               │
     │    }                    │                           │
     │  ]                      │                           │
     │<────────────────────────┤                           │
     │                         │                           │


┌─────────────────────────────────────────────────────────────────────────┐
│                        SEARCHING MESSAGES                                │
└─────────────────────────────────────────────────────────────────────────┘

   Client                    Server                    Database
     │                         │                           │
     │  GET /api/message/      │                           │
     │  search?query=Hello     │                           │
     ├────────────────────────>│                           │
     │                         │                           │
     │                         │  1. Fetch ALL messages    │
     │                         │<──────────────────────────┤
     │                         │  [                        │
     │                         │    { content: "U2Fsd..." },│ (encrypted)
     │                         │    { content: "QmFzZT..." },│ (encrypted)
     │                         │    { content: "SGVsbG..." } │ (encrypted)
     │                         │  ]                        │
     │                         │                           │
     │                         │  2. Decrypt ALL messages  │
     │                         │     - "Hello!"            │
     │                         │     - "Goodbye!"          │
     │                         │     - "How are you?"      │
     │                         │                           │
     │                         │  3. Search in decrypted   │
     │                         │     content for "Hello"   │
     │                         │                           │
     │                         │  4. Return matches        │
     │  Response:              │                           │
     │  [                      │                           │
     │    {                    │                           │
     │      content: "Hello!"  │ (matched & decrypted)     │
     │    }                    │                           │
     │  ]                      │                           │
     │<────────────────────────┤                           │
     │                         │                           │
```

## Encryption Details

### AES-256-GCM Components

```
┌──────────────────────────────────────────────────────────────┐
│                    ENCRYPTION PROCESS                         │
└──────────────────────────────────────────────────────────────┘

Input: "Hello, how are you?"
   │
   ├─> Encryption Key (256-bit from env)
   │   "a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6..."
   │
   ├─> Random IV (128-bit, unique per message)
   │   "x7y8z9a0b1c2d3e4f5g6h7i8"
   │
   └─> AES-256-GCM Algorithm
       │
       ├─> Encrypted Content (Base64)
       │   "U2FsdGVkX1+vupppZksvRf5pq5g5XjFRlipRkwB0K1Y="
       │
       └─> Auth Tag (128-bit, for verification)
           "m3n4o5p6q7r8s9t0u1v2w3x4"

Stored in Database:
{
  content: "U2FsdGVkX1+vupppZksvRf5pq5g5XjFRlipRkwB0K1Y=",
  iv: "x7y8z9a0b1c2d3e4f5g6h7i8",
  authTag: "m3n4o5p6q7r8s9t0u1v2w3x4"
}
```

### Decryption Process

```
┌──────────────────────────────────────────────────────────────┐
│                    DECRYPTION PROCESS                         │
└──────────────────────────────────────────────────────────────┘

From Database:
{
  content: "U2FsdGVkX1+vupppZksvRf5pq5g5XjFRlipRkwB0K1Y=",
  iv: "x7y8z9a0b1c2d3e4f5g6h7i8",
  authTag: "m3n4o5p6q7r8s9t0u1v2w3x4"
}
   │
   ├─> Encryption Key (same 256-bit key)
   │   "a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6..."
   │
   ├─> IV (from database)
   │   "x7y8z9a0b1c2d3e4f5g6h7i8"
   │
   ├─> Auth Tag (verify integrity)
   │   "m3n4o5p6q7r8s9t0u1v2w3x4"
   │
   └─> AES-256-GCM Decryption
       │
       └─> Decrypted Content
           "Hello, how are you?"

Returned to Client:
{
  content: "Hello, how are you?"
}
```

## Security Features

```
┌──────────────────────────────────────────────────────────────┐
│                      SECURITY LAYERS                          │
└──────────────────────────────────────────────────────────────┘

1. Encryption at Rest
   ├─> Messages stored encrypted in MongoDB
   └─> Database breach = encrypted data only

2. Authenticated Encryption (GCM)
   ├─> Auth tag prevents tampering
   └─> Modified encrypted data = decryption fails

3. Unique IV per Message
   ├─> Same message = different encrypted output
   └─> Prevents pattern analysis

4. Strong Key (256-bit)
   ├─> Industry standard strength
   └─> Resistant to brute force attacks

5. Backward Compatibility
   ├─> Supports non-encrypted messages
   └─> Graceful migration path
```

## What's Protected vs Not Protected

```
┌──────────────────────────────────────────────────────────────┐
│                    PROTECTION SCOPE                           │
└──────────────────────────────────────────────────────────────┘

✅ PROTECTED (Encrypted in Database)
   ├─> Message content
   └─> Edited message content

❌ NOT PROTECTED (Stored as Plain Text)
   ├─> Sender ID
   ├─> Receiver ID
   ├─> Chat ID
   ├─> Timestamp
   ├─> Message status
   └─> Message type

⚠️  ADDITIONAL PROTECTION NEEDED
   ├─> Use HTTPS for data in transit
   ├─> Implement client-side encryption for true E2E
   └─> Encrypt media files separately
```

