/**
 * Frontend Crypto Utilities for BountyChain MVP
 * 
 * Uses Web Crypto API for encryption (browser-native)
 * Compatible with backend's Node.js crypto module
 */

const API_BASE_URL = 'http://localhost:3001/api';

/**
 * Convert string to ArrayBuffer
 */
function str2ab(str) {
  const buf = new ArrayBuffer(str.length);
  const bufView = new Uint8Array(buf);
  for (let i = 0; i < str.length; i++) {
    bufView[i] = str.charCodeAt(i);
  }
  return buf;
}

/**
 * Convert ArrayBuffer to base64
 */
function arrayBufferToBase64(buffer) {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

/**
 * Convert base64 to ArrayBuffer
 */
function base64ToArrayBuffer(base64) {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
}

/**
 * Generate RSA key pair (for demo - in production use wallet-derived keys)
 */
export async function generateKeyPair() {
  const keyPair = await window.crypto.subtle.generateKey(
    {
      name: 'RSA-OAEP',
      modulusLength: 2048,
      publicExponent: new Uint8Array([1, 0, 1]),
      hash: 'SHA-256',
    },
    true,
    ['encrypt', 'decrypt']
  );

  // Export to PEM format
  const publicKey = await window.crypto.subtle.exportKey('spki', keyPair.publicKey);
  const privateKey = await window.crypto.subtle.exportKey('pkcs8', keyPair.privateKey);

  const publicKeyPem = `-----BEGIN PUBLIC KEY-----\n${arrayBufferToBase64(publicKey)}\n-----END PUBLIC KEY-----`;
  const privateKeyPem = `-----BEGIN PRIVATE KEY-----\n${arrayBufferToBase64(privateKey)}\n-----END PRIVATE KEY-----`;

  return {
    publicKey: publicKeyPem,
    privateKey: privateKeyPem,
    publicKeyRaw: keyPair.publicKey,
    privateKeyRaw: keyPair.privateKey
  };
}

/**
 * Import RSA public key from PEM
 */
export async function importPublicKey(pemKey) {
  const pemHeader = '-----BEGIN PUBLIC KEY-----';
  const pemFooter = '-----END PUBLIC KEY-----';
  const pemContents = pemKey.substring(
    pemHeader.length,
    pemKey.length - pemFooter.length - 1
  ).replace(/\s/g, '');
  
  const binaryDer = base64ToArrayBuffer(pemContents);

  return await window.crypto.subtle.importKey(
    'spki',
    binaryDer,
    {
      name: 'RSA-OAEP',
      hash: 'SHA-256',
    },
    true,
    ['encrypt']
  );
}

/**
 * Import RSA private key from PEM
 */
export async function importPrivateKey(pemKey) {
  const pemHeader = '-----BEGIN PRIVATE KEY-----';
  const pemFooter = '-----END PRIVATE KEY-----';
  const pemContents = pemKey.substring(
    pemHeader.length,
    pemKey.length - pemFooter.length - 1
  ).replace(/\s/g, '');
  
  const binaryDer = base64ToArrayBuffer(pemContents);

  return await window.crypto.subtle.importKey(
    'pkcs8',
    binaryDer,
    {
      name: 'RSA-OAEP',
      hash: 'SHA-256',
    },
    true,
    ['decrypt']
  );
}

/**
 * Encrypt report text with AES-256-GCM + RSA
 * @param {string} reportText - Plaintext bug report
 * @param {string} ownerPublicKeyPem - Bounty owner's public key (PEM)
 * @returns {Object} { encryptedPayload, encryptedKey }
 */
export async function encryptReport(reportText, ownerPublicKeyPem) {
  // 1. Generate random AES key
  const aesKey = await window.crypto.subtle.generateKey(
    {
      name: 'AES-GCM',
      length: 256,
    },
    true,
    ['encrypt', 'decrypt']
  );

  // 2. Generate random IV
  const iv = window.crypto.getRandomValues(new Uint8Array(16));

  // 3. Encrypt report with AES-256-GCM
  const encodedText = new TextEncoder().encode(reportText);
  const encryptedData = await window.crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv: iv,
    },
    aesKey,
    encodedText
  );

  // Extract auth tag (last 16 bytes for GCM)
  const encryptedBytes = new Uint8Array(encryptedData);
  const encrypted = encryptedBytes.slice(0, -16);
  const authTag = encryptedBytes.slice(-16);

  // 4. Export AES key
  const rawAesKey = await window.crypto.subtle.exportKey('raw', aesKey);

  // 5. Import owner's public key
  const publicKey = await importPublicKey(ownerPublicKeyPem);

  // 6. Encrypt AES key with RSA
  const encryptedAesKey = await window.crypto.subtle.encrypt(
    {
      name: 'RSA-OAEP',
    },
    publicKey,
    rawAesKey
  );

  // 7. Package payload
  const payload = {
    encrypted: arrayBufferToBase64(encrypted),
    iv: arrayBufferToBase64(iv),
    authTag: arrayBufferToBase64(authTag),
    algorithm: 'AES-256-GCM'
  };

  return {
    encryptedPayload: btoa(JSON.stringify(payload)),
    encryptedKey: arrayBufferToBase64(encryptedAesKey)
  };
}

/**
 * Decrypt report (owner only - requires private key)
 * @param {string} encryptedPayload - Base64 encrypted payload
 * @param {string} encryptedKey - Base64 encrypted AES key
 * @param {string} privateKeyPem - Owner's private key (PEM)
 * @returns {string} Decrypted report text
 */
export async function decryptReport(encryptedPayload, encryptedKey, privateKeyPem) {
  // 1. Import private key
  const privateKey = await importPrivateKey(privateKeyPem);

  // 2. Decrypt AES key
  const encryptedAesKeyBuffer = base64ToArrayBuffer(encryptedKey);
  const aesKeyBuffer = await window.crypto.subtle.decrypt(
    {
      name: 'RSA-OAEP',
    },
    privateKey,
    encryptedAesKeyBuffer
  );

  // 3. Import AES key
  const aesKey = await window.crypto.subtle.importKey(
    'raw',
    aesKeyBuffer,
    {
      name: 'AES-GCM',
      length: 256,
    },
    false,
    ['decrypt']
  );

  // 4. Parse payload
  const payloadStr = atob(encryptedPayload);
  const payload = JSON.parse(payloadStr);

  // 5. Reconstruct encrypted data with auth tag
  const encrypted = base64ToArrayBuffer(payload.encrypted);
  const authTag = base64ToArrayBuffer(payload.authTag);
  const encryptedWithTag = new Uint8Array(encrypted.byteLength + authTag.byteLength);
  encryptedWithTag.set(new Uint8Array(encrypted), 0);
  encryptedWithTag.set(new Uint8Array(authTag), encrypted.byteLength);

  // 6. Decrypt with AES-GCM
  const decryptedData = await window.crypto.subtle.decrypt(
    {
      name: 'AES-GCM',
      iv: base64ToArrayBuffer(payload.iv),
    },
    aesKey,
    encryptedWithTag
  );

  // 7. Decode to text
  return new TextDecoder().decode(decryptedData);
}

/**
 * API: Submit encrypted bug report
 */
export async function submitReport(bountyId, hackerWallet, reportText) {
  // Get bounty to fetch owner's public key
  const bountyRes = await fetch(`${API_BASE_URL}/bounties/${bountyId}`);
  if (!bountyRes.ok) {
    throw new Error('Bounty not found');
  }
  const data = await bountyRes.json();
  const bounty = data.bounty;

  if (!bounty.ownerPublicKey) {
    throw new Error('Bounty owner public key not found');
  }

  // Encrypt report
  const { encryptedPayload, encryptedKey } = await encryptReport(
    reportText,
    bounty.ownerPublicKey
  );

  // Submit to backend
  const response = await fetch(`${API_BASE_URL}/reports`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      bountyId,
      hackerWallet,
      reportText: JSON.stringify({ encryptedPayload, encryptedKey }) // Backend expects this format
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Report submission failed');
  }

  return await response.json();
}

/**
 * API: Get encrypted report
 */
export async function getReport(reportId) {
  const response = await fetch(`${API_BASE_URL}/reports/${reportId}`);
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to fetch report');
  }

  return await response.json();
}

/**
 * API: Update report status
 */
export async function updateReportStatus(reportId, status, walletAddress) {
  const response = await fetch(`${API_BASE_URL}/reports/${reportId}/status`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      status,
      walletAddress
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Status update failed');
  }

  return await response.json();
}

/**
 * API: Create bounty
 */
export async function createBounty(title, rewardAmount, ownerWallet, description) {
  // Generate unique ID based on timestamp and random string
  const id = `bounty-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  
  const response = await fetch(`${API_BASE_URL}/bounties`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      id,
      title,
      description: description || '',
      rewardAmount,
      ownerWallet
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Bounty creation failed');
  }

  return await response.json();
}

/**
 * API: Get bounty
 */
export async function getBounty(bountyId) {
  const response = await fetch(`${API_BASE_URL}/bounties/${bountyId}`);
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Bounty not found');
  }

  return await response.json();
}

/**
 * API: List bounties
 */
export async function listBounties() {
  const response = await fetch(`${API_BASE_URL}/bounties`);
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to list bounties');
  }

  return await response.json();
}

/**
 * API: List reports for bounty
 */
export async function listReportsForBounty(bountyId) {
  const response = await fetch(`${API_BASE_URL}/reports/bounty/${bountyId}`);
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to list reports');
  }

  return await response.json();
}
