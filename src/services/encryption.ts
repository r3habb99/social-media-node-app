import crypto from "crypto";
import { logger } from "./logger";

/**
 * Encryption service for end-to-end message encryption
 * Uses AES-256-GCM for authenticated encryption
 */

// Get encryption key from environment variable (REQUIRED)
// Generate a key using: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
if (!process.env.MESSAGE_ENCRYPTION_KEY) {
  throw new Error(
    'MESSAGE_ENCRYPTION_KEY environment variable is required for message encryption. ' +
    'Generate one using: node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'hex\'))"'
  );
}

const ENCRYPTION_KEY = process.env.MESSAGE_ENCRYPTION_KEY;

// Ensure the key is 32 bytes (256 bits) for AES-256
const getEncryptionKey = (): Buffer => {
  // Convert hex string to buffer
  const keyBuffer = Buffer.from(ENCRYPTION_KEY, 'hex');
  
  // If key is not 32 bytes, derive it using SHA-256
  if (keyBuffer.length !== 32) {
    return crypto.createHash('sha256').update(ENCRYPTION_KEY).digest();
  }
  
  return keyBuffer;
};

/**
 * Encrypted message structure
 */
export interface EncryptedData {
  encryptedContent: string; // Base64 encoded encrypted content
  iv: string; // Base64 encoded initialization vector
  authTag: string; // Base64 encoded authentication tag
}

/**
 * Encrypt message content using AES-256-GCM
 * @param content - Plain text message content
 * @returns Encrypted data object containing encrypted content, IV, and auth tag
 */
export const encryptMessage = (content: string): EncryptedData => {
  try {
    // Generate a random initialization vector (IV)
    const iv = crypto.randomBytes(16);
    
    // Get the encryption key
    const key = getEncryptionKey();
    
    // Create cipher with AES-256-GCM
    const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
    
    // Encrypt the content
    let encrypted = cipher.update(content, 'utf8', 'base64');
    encrypted += cipher.final('base64');
    
    // Get the authentication tag
    const authTag = cipher.getAuthTag();
    
    return {
      encryptedContent: encrypted,
      iv: iv.toString('base64'),
      authTag: authTag.toString('base64')
    };
  } catch (error) {
    logger.error("Error encrypting message:", error);
    throw new Error("Failed to encrypt message");
  }
};

/**
 * Decrypt message content using AES-256-GCM
 * @param encryptedData - Encrypted data object containing encrypted content, IV, and auth tag
 * @returns Decrypted plain text message content
 */
export const decryptMessage = (encryptedData: EncryptedData): string => {
  try {
    // Get the encryption key
    const key = getEncryptionKey();
    
    // Convert base64 strings back to buffers
    const iv = Buffer.from(encryptedData.iv, 'base64');
    const authTag = Buffer.from(encryptedData.authTag, 'base64');
    
    // Create decipher with AES-256-GCM
    const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
    
    // Set the authentication tag
    decipher.setAuthTag(authTag);
    
    // Decrypt the content
    let decrypted = decipher.update(encryptedData.encryptedContent, 'base64', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } catch (error) {
    logger.error("Error decrypting message:", error);
    throw new Error("Failed to decrypt message");
  }
};

/**
 * Decrypt a single message object
 * @param message - Message object with encrypted content
 * @returns Message object with decrypted content
 */
export const decryptMessageObject = (message: any): any => {
  try {
    // If message doesn't have encryption metadata, return as is (backward compatibility)
    if (!message.iv || !message.authTag) {
      return message;
    }
    
    // Decrypt the content
    const decryptedContent = decryptMessage({
      encryptedContent: message.content,
      iv: message.iv,
      authTag: message.authTag
    });
    
    // Return message with decrypted content
    return {
      ...message.toObject ? message.toObject() : message,
      content: decryptedContent
    };
  } catch (error) {
    logger.error("Error decrypting message object:", error);
    // Return original message if decryption fails (for backward compatibility)
    return message;
  }
};

/**
 * Decrypt an array of message objects
 * @param messages - Array of message objects with encrypted content
 * @returns Array of message objects with decrypted content
 */
export const decryptMessages = (messages: any[]): any[] => {
  return messages.map(message => decryptMessageObject(message));
};

