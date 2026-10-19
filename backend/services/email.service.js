const { env } = require('../config/env');

/**
 * Provider-agnostic email sender.
 * With no EMAIL_PROVIDER configured it logs the message so flows stay testable.
 * Plug a provider (Resend, SendGrid, Postmark) inside `deliver`.
 */
async function deliver({ to, subject, html }) {
  if (!env.email.provider || !env.email.apiKey) {
    console.info(`[email:noop] to=${to} subject="${subject}"`);
    return { delivered: false, reason: 'no_provider_configured' };
  }

  if (env.email.provider.toLowerCase() === 'resend') {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${env.email.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ from: env.email.from, to, subject, html }),
    });
    if (!res.ok) throw new Error(`Email provider error: ${res.status}`);
    return { delivered: true };
  }

  console.warn(`[email] Unsupported provider "${env.email.provider}"`);
  return { delivered: false, reason: 'unsupported_provider' };
}

const sendVerificationEmail = (to, token) =>
  deliver({
    to,
    subject: 'Verify your email',
    html: `<p>Confirm your account:</p><p><a href="${env.clientUrl}/verify-email?token=${token}">Verify email</a></p>`,
  });

const sendPasswordResetEmail = (to, token) =>
  deliver({
    to,
    subject: 'Reset your password',
    html: `<p>Reset your password (valid for 30 minutes):</p><p><a href="${env.clientUrl}/reset-password?token=${token}">Reset password</a></p>`,
  });

const sendAnnouncementEmail = (to, title, message) =>
  deliver({ to, subject: title, html: `<h2>${title}</h2><p>${message}</p>` });

module.exports = { deliver, sendVerificationEmail, sendPasswordResetEmail, sendAnnouncementEmail };
