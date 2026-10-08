const { Resend } = require('resend');

// Only construct the client if a key is actually present — lets the rest of
// the app keep working (registration, login, everything else) even if email
// isn't configured yet. forgotPassword just returns a clear error in that case
// instead of crashing.
let resend = null;
if (process.env.RESEND_API_KEY) {
  resend = new Resend(process.env.RESEND_API_KEY);
}

// FROM address must be on a domain you've verified in Resend. Resend's
// own onboarding@resend.dev works immediately with zero setup, for testing —
// swap to your own verified domain before this goes live for real users.
const FROM_ADDRESS = process.env.RESEND_FROM_EMAIL || 'MultiStore <onboarding@resend.dev>';

async function sendPasswordResetEmail({ to, name, resetUrl }) {
  if (!resend) {
    throw Object.assign(new Error('Email is not configured on this server (RESEND_API_KEY missing).'), { statusCode: 503 });
  }

  await resend.emails.send({
    from: FROM_ADDRESS,
    to,
    subject: 'Reset your MultiStore password',
    html: `
      <div style="font-family: -apple-system, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 24px;">
        <h2 style="color: #111827; margin-bottom: 8px;">Reset your password</h2>
        <p style="color: #4b5563; font-size: 14px; line-height: 1.6;">
          Hi ${name || 'there'}, we received a request to reset your MultiStore password.
          This link expires in 1 hour.
        </p>
        <a href="${resetUrl}"
           style="display: inline-block; margin: 20px 0; padding: 12px 24px; background: #111827; color: #fff; text-decoration: none; border-radius: 10px; font-weight: 600; font-size: 14px;">
          Reset Password
        </a>
        <p style="color: #9ca3af; font-size: 12px; line-height: 1.6;">
          If you didn't request this, you can safely ignore this email — your password won't change.
        </p>
      </div>
    `,
  });
}

module.exports = { sendPasswordResetEmail };