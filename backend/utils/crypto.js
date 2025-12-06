import crypto from 'crypto';

/**
 * Hybrid Encryption Utilities for BountyChain MVP
 * 
 * Security Model:
 * 1. Generate random AES-256 key per report
 * 2. Encrypt report text with AES-256-GCM (authenticated encryption)
 * 3. Encrypt AES key with bounty owner's RSA public key
 * 4. Store only encrypted data in database
 * 
 * Backend NEVER sees plaintext or private keys.
 * Only bounty owner can decrypt with their private key (client-side).
 */

/**
 * Generate random AES-256 key
 * @returns {Buffer} 32-byte AES key
 */
export function generateAESKey() {
  return crypto.randomBytes(32); // 256 bits
}

/**
 * Encrypt plaintext with AES-256-GCM
 * @param {string} plaintext - Report text to encrypt
 * @param {Buffer} aesKey - 32-byte AES key
 * @returns {Object} { encrypted: string, iv: string, authTag: string }
 */
export function encryptWithAES(plaintext, aesKey) {
  // Generate random IV (Initialization Vector)
  const iv = crypto.randomBytes(16); // 128 bits for GCM
  
  // Create cipher
  const cipher = crypto.createCipheriv('aes-256-gcm', aesKey, iv);
  
  // Encrypt
  let encrypted = cipher.update(plaintext, 'utf8', 'base64');
  encrypted += cipher.final('base64');
  
  // Get authentication tag (GCM mode provides integrity check)
  const authTag = cipher.getAuthTag();
  
  return {
    encrypted: encrypted,
    iv: iv.toString('base64'),
    authTag: authTag.toString('base64')
  };
}

/**
 * Decrypt AES-256-GCM encrypted data
 * @param {string} encrypted - Base64 encrypted text
 * @param {Buffer} aesKey - 32-byte AES key
 * @param {string} iv - Base64 IV
 * @param {string} authTag - Base64 auth tag
 * @returns {string} Decrypted plaintext
 */
export function decryptWithAES(encrypted, aesKey, iv, authTag) {
  const decipher = crypto.createDecipheriv(
    'aes-256-gcm',
    aesKey,
    Buffer.from(iv, 'base64')
  );
  
  decipher.setAuthTag(Buffer.from(authTag, 'base64'));
  
  let decrypted = decipher.update(encrypted, 'base64', 'utf8');
  decrypted += decipher.final('utf8');
  
  return decrypted;
}

/**
 * Encrypt AES key with RSA public key
 * @param {Buffer} aesKey - AES key to encrypt
 * @param {string} publicKeyPem - RSA public key in PEM format
 * @returns {string} Base64 encrypted AES key
 */
export function encryptAESKeyWithRSA(aesKey, publicKeyPem) {
  const encrypted = crypto.publicEncrypt(
    {
      key: publicKeyPem,
      padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
      oaepHash: 'sha256',
    },
    aesKey
  );
  
  return encrypted.toString('base64');
}

/**
 * Decrypt AES key with RSA private key (CLIENT-SIDE ONLY)
 * @param {string} encryptedKey - Base64 encrypted AES key
 * @param {string} privateKeyPem - RSA private key in PEM format
 * @returns {Buffer} Decrypted AES key
 */
export function decryptAESKeyWithRSA(encryptedKey, privateKeyPem) {
  const decrypted = crypto.privateDecrypt(
    {
      key: privateKeyPem,
      padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
      oaepHash: 'sha256',
    },
    Buffer.from(encryptedKey, 'base64')
  );
  
  return decrypted;
}

/**
 * Full encryption flow for bug report submission
 * @param {string} reportText - Plaintext bug report
 * @param {string} ownerPublicKey - Bounty owner's RSA public key (PEM)
 * @returns {Object} { encryptedPayload: string, encryptedKey: string }
 */
export function encryptReport(reportText, ownerPublicKey) {
  // 1. Generate random AES key
  const aesKey = generateAESKey();
  
  // 2. Encrypt report with AES-256-GCM
  const { encrypted, iv, authTag } = encryptWithAES(reportText, aesKey);
  
  // 3. Combine encrypted data with metadata
  const payload = JSON.stringify({
    encrypted,
    iv,
    authTag,
    algorithm: 'AES-256-GCM'
  });
  
  // 4. Encrypt AES key with owner's public key
  const encryptedKey = encryptAESKeyWithRSA(aesKey, ownerPublicKey);
  
  return {
    encryptedPayload: Buffer.from(payload).toString('base64'),
    encryptedKey
  };
}

/**
 * Full decryption flow (CLIENT-SIDE ONLY)
 * @param {string} encryptedPayload - Base64 payload from DB
 * @param {string} encryptedKey - Base64 encrypted AES key
 * @param {string} privateKeyPem - Owner's RSA private key (PEM)
 * @returns {string} Decrypted report text
 */
export function decryptReport(encryptedPayload, encryptedKey, privateKeyPem) {
  // 1. Decrypt AES key with private key
  const aesKey = decryptAESKeyWithRSA(encryptedKey, privateKeyPem);
  
  // 2. Parse encrypted payload
  const payloadStr = Buffer.from(encryptedPayload, 'base64').toString('utf8');
  const { encrypted, iv, authTag } = JSON.parse(payloadStr);
  
  // 3. Decrypt report with AES key
  const reportText = decryptWithAES(encrypted, aesKey, iv, authTag);
  
  return reportText;
}

/**
 * Generate RSA key pair (for testing/demo - real keys come from wallet)
 * @returns {Object} { publicKey: string, privateKey: string }
 */
export function generateRSAKeyPair() {
  const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
    modulusLength: 2048,
    publicKeyEncoding: {
      type: 'spki',
      format: 'pem'
    },
    privateKeyEncoding: {
      type: 'pkcs8',
      format: 'pem'
    }
  });
  
  return { publicKey, privateKey };
}
