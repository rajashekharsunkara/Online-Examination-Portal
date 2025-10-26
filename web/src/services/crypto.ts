/**
 * Encryption Service
 * Client-side AES-256-GCM encryption for exam answers
 * Uses Web Crypto API with PBKDF2 key derivation
 */

// Constants
const ITERATIONS = 250000; // PBKDF2 iterations (OWASP recommended)
const KEY_LENGTH = 256; // AES-256
const IV_LENGTH = 12; // GCM standard IV length (96 bits)
const SALT_LENGTH = 16; // 128 bits

// Encoders
const encoder = new TextEncoder();
const decoder = new TextDecoder();

/**
 * Convert ArrayBuffer to Base64 string
 */
function bufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

/**
 * Convert Base64 string to ArrayBuffer
 */
function base64ToBuffer(base64: string): ArrayBuffer {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

/**
 * Generate random salt for PBKDF2
 */
export function generateSalt(): string {
  const salt = crypto.getRandomValues(new Uint8Array(SALT_LENGTH));
  return bufferToBase64(salt);
}

/**
 * Generate random IV for AES-GCM
 */
function generateIV(): Uint8Array {
  return crypto.getRandomValues(new Uint8Array(IV_LENGTH));
}

/**
 * Create PBKDF2 key from password
 */
async function getPasswordKey(password: string): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    'PBKDF2',
    false,
    ['deriveKey']
  );
}

/**
 * Derive AES-GCM key from PBKDF2 key and salt
 */
async function deriveKey(
  passwordKey: CryptoKey,
  salt: Uint8Array,
  keyUsage: KeyUsage[]
): Promise<CryptoKey> {
  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt,
      iterations: ITERATIONS,
      hash: 'SHA-256',
    },
    passwordKey,
    { name: 'AES-GCM', length: KEY_LENGTH },
    false,
    keyUsage
  );
}

/**
 * Derive encryption password from student context
 * Uses: username + exam_id + submission timestamp for uniqueness
 */
export function deriveEncryptionPassword(
  username: string,
  examId: number,
  timestamp: string
): string {
  return `${username}:${examId}:${timestamp}`;
}

/**
 * Encrypt data using AES-256-GCM
 * 
 * @param data - Data to encrypt (will be JSON stringified)
 * @param password - Password for key derivation
 * @param salt - Base64-encoded salt (must be same for encryption/decryption)
 * @returns Base64-encoded encrypted data with format: salt+iv+ciphertext
 */
export async function encryptData(
  data: any,
  password: string,
  salt: string
): Promise<string> {
  try {
    // Convert data to JSON string
    const jsonString = JSON.stringify(data);
    const dataBuffer = encoder.encode(jsonString);
    
    // Convert salt from base64
    const saltBuffer = new Uint8Array(base64ToBuffer(salt));
    
    // Generate random IV
    const iv = generateIV();
    
    // Derive encryption key
    const passwordKey = await getPasswordKey(password);
    const aesKey = await deriveKey(passwordKey, saltBuffer, ['encrypt']);
    
    // Encrypt data
    const encryptedData = await crypto.subtle.encrypt(
      {
        name: 'AES-GCM',
        iv: iv,
      },
      aesKey,
      dataBuffer
    );
    
    // Combine salt + IV + encrypted data
    const combinedBuffer = new Uint8Array(
      saltBuffer.length + iv.length + encryptedData.byteLength
    );
    combinedBuffer.set(saltBuffer, 0);
    combinedBuffer.set(iv, saltBuffer.length);
    combinedBuffer.set(new Uint8Array(encryptedData), saltBuffer.length + iv.length);
    
    // Return as base64
    return bufferToBase64(combinedBuffer.buffer);
  } catch (error) {
    console.error('Encryption error:', error);
    throw new Error('Failed to encrypt data');
  }
}

/**
 * Decrypt data using AES-256-GCM
 * 
 * @param encryptedData - Base64-encoded encrypted data (salt+iv+ciphertext)
 * @param password - Password for key derivation (must match encryption password)
 * @returns Decrypted data (parsed from JSON)
 */
export async function decryptData(
  encryptedData: string,
  password: string
): Promise<any> {
  try {
    // Convert from base64
    const combinedBuffer = new Uint8Array(base64ToBuffer(encryptedData));
    
    // Extract salt, IV, and encrypted data
    const salt = combinedBuffer.slice(0, SALT_LENGTH);
    const iv = combinedBuffer.slice(SALT_LENGTH, SALT_LENGTH + IV_LENGTH);
    const data = combinedBuffer.slice(SALT_LENGTH + IV_LENGTH);
    
    // Derive decryption key
    const passwordKey = await getPasswordKey(password);
    const aesKey = await deriveKey(passwordKey, salt, ['decrypt']);
    
    // Decrypt data
    const decryptedData = await crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv: iv,
      },
      aesKey,
      data
    );
    
    // Convert back to string and parse JSON
    const jsonString = decoder.decode(decryptedData);
    return JSON.parse(jsonString);
  } catch (error) {
    console.error('Decryption error:', error);
    throw new Error('Failed to decrypt data or authentication tag verification failed');
  }
}

/**
 * Encrypt exam answers for final submission
 * 
 * @param answers - Array of answer objects
 * @param username - Student username
 * @param examId - Exam ID
 * @param salt - Base64-encoded salt from attempt
 * @returns Encrypted answers as base64 string
 */
export async function encryptAnswers(
  answers: any[],
  username: string,
  examId: number,
  salt: string
): Promise<string> {
  const timestamp = new Date().toISOString();
  const password = deriveEncryptionPassword(username, examId, timestamp);
  
  const payload = {
    answers,
    username,
    examId,
    timestamp,
    version: '1.0',
  };
  
  return encryptData(payload, password, salt);
}

/**
 * Decrypt exam answers
 * 
 * @param encryptedAnswers - Base64-encoded encrypted answers
 * @param username - Student username
 * @param examId - Exam ID
 * @param timestamp - Submission timestamp (from metadata)
 * @returns Decrypted answers array
 */
export async function decryptAnswers(
  encryptedAnswers: string,
  username: string,
  examId: number,
  timestamp: string
): Promise<any[]> {
  const password = deriveEncryptionPassword(username, examId, timestamp);
  const payload = await decryptData(encryptedAnswers, password);
  
  // Verify metadata
  if (payload.username !== username || payload.examId !== examId) {
    throw new Error('Decrypted data does not match expected metadata');
  }
  
  return payload.answers;
}

/**
 * Generate SHA-256 checksum of encrypted data for verification
 */
export async function generateChecksum(data: string): Promise<string> {
  const buffer = encoder.encode(data);
  const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
  return bufferToBase64(hashBuffer);
}

/**
 * Test encryption/decryption round-trip
 * For development and testing purposes
 */
export async function testEncryption(): Promise<boolean> {
  try {
    const testData = {
      question_id: 1,
      answer: { selected: 'A' },
      is_flagged: false,
    };
    
    const salt = generateSalt();
    const password = 'test_password_123';
    
    // Encrypt
    const encrypted = await encryptData(testData, password, salt);
    console.log('Encrypted:', encrypted);
    
    // Decrypt
    const decrypted = await decryptData(encrypted, password);
    console.log('Decrypted:', decrypted);
    
    // Verify
    const match = JSON.stringify(testData) === JSON.stringify(decrypted);
    console.log('Round-trip successful:', match);
    
    return match;
  } catch (error) {
    console.error('Encryption test failed:', error);
    return false;
  }
}
