const crypto = require('crypto');

// Generates a random reset token. Returns BOTH the raw token (goes in the
// emailed link — never stored) and its SHA-256 hash (stored in the DB).
// Same "never store the thing that grants access, only its hash" principle
// used for passwords.
function generatePasswordResetToken() {
  const rawToken = crypto.randomBytes(32).toString('hex');
  const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
  return { rawToken, tokenHash };
}

function hashPasswordResetToken(rawToken) {
  return crypto.createHash('sha256').update(rawToken).digest('hex');
}

module.exports = { generatePasswordResetToken, hashPasswordResetToken };