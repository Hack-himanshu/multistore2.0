const crypto = require('crypto');

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12; // Recommended IV length for GCM

// Derives a 32-byte key from the ENCRYPTION_KEY env var (expected as a 64-char
// hex string — see .env.example). Throws clearly at startup-time use rather
// than silently encrypting with a wrong-length key.
function getKey() {
  const raw = process.env.ENCRYPTION_KEY;
  if (!raw || raw.length !== 64) {
    throw new Error(
      'ENCRYPTION_KEY is missing or invalid. It must be a 64-character hex string ' +
      '(32 bytes) — generate one with: node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'hex\'))"'
    );
  }
  return Buffer.from(raw, 'hex');
}

// Encrypts a plaintext string (e.g. a payment gateway secret key) into a
// single string safe to store in MongoDB: "iv:authTag:ciphertext" (all hex).
function encrypt(plaintext) {
  if (typeof plaintext !== 'string' || plaintext.length === 0) {
    throw new Error('encrypt() requires a non-empty string');
  }
  const key = getKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  const ciphertext = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return `${iv.toString('hex')}:${authTag.toString('hex')}:${ciphertext.toString('hex')}`;
}

// Decrypts a string produced by encrypt(). Throws if the data was tampered
// with or the key is wrong — GCM's auth tag check fails closed, it never
// silently returns corrupted plaintext.
function decrypt(payload) {
  if (typeof payload !== 'string' || payload.split(':').length !== 3) {
    throw new Error('decrypt() received a malformed payload');
  }
  const key = getKey();
  const [ivHex, authTagHex, ciphertextHex] = payload.split(':');
  const decipher = crypto.createDecipheriv(ALGORITHM, key, Buffer.from(ivHex, 'hex'));
  decipher.setAuthTag(Buffer.from(authTagHex, 'hex'));
  const plaintext = Buffer.concat([
    decipher.update(Buffer.from(ciphertextHex, 'hex')),
    decipher.final(),
  ]);
  return plaintext.toString('utf8');
}

// Masks a secret for display purposes — e.g. "rzp_live_abc123xyz" -> "rzp_live_••••••••xyz"
// Never used on values that need to stay fully hidden (real secret keys);
// only for semi-public identifiers like a Key ID that's fine to partially show.
function maskForDisplay(value, visibleTail = 4) {
  if (!value || value.length <= visibleTail) return '••••••••';
  return `${'•'.repeat(Math.max(4, value.length - visibleTail))}${value.slice(-visibleTail)}`;
}

module.exports = { encrypt, decrypt, maskForDisplay };
