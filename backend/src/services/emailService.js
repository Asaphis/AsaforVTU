const frontendUrl = () => (
  process.env.FRONTEND_URL ||
  process.env.NEXT_PUBLIC_APP_URL ||
  process.env.APP_URL ||
  'http://localhost:3000'
).replace(/\/$/, '');

const emailFrom = () => process.env.EMAIL_FROM || process.env.RESEND_FROM || 'no-reply@asaforvtu.com';

async function sendEmail({ to, subject, html, text }) {
  if (!to) throw new Error('Recipient email is required');

  // Resend is intentionally used through fetch so the backend does not need a
  // second mail SDK. Production must provide RESEND_API_KEY and EMAIL_FROM.
  if (process.env.RESEND_API_KEY) {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ from: emailFrom(), to: [to], subject, html, text })
    });
    if (!response.ok) {
      const body = await response.text();
      throw new Error(`Email provider rejected request (${response.status}): ${body.slice(0, 300)}`);
    }
    return { delivered: true };
  }

  if (process.env.NODE_ENV === 'production') {
    throw new Error('RESEND_API_KEY is required for production email delivery');
  }

  // Development fallback: preserve the link in logs for local testing, never
  // return it from the public API response.
  console.info(`[Email:development] ${to} :: ${subject}\n${text || html}`);
  return { delivered: false, development: true };
}

async function sendVerificationEmail({ email, token }) {
  const link = `${frontendUrl()}/verify-email?token=${encodeURIComponent(token)}`;
  return sendEmail({
    to: email,
    subject: 'Verify your Asafor VTU account',
    text: `Verify your account by opening: ${link}`,
    html: `<p>Verify your Asafor VTU account:</p><p><a href="${link}">Verify email address</a></p><p>This link expires in 24 hours.</p>`
  });
}

async function sendPasswordResetEmail({ email, token }) {
  const link = `${frontendUrl()}/reset-password/${encodeURIComponent(token)}`;
  return sendEmail({
    to: email,
    subject: 'Reset your Asafor VTU password',
    text: `Reset your password by opening: ${link}`,
    html: `<p>Reset your Asafor VTU password:</p><p><a href="${link}">Reset password</a></p><p>This link expires in 1 hour.</p>`
  });
}

async function sendReferralSignupEmail({ email, name, referredName }) {
  return sendEmail({
    to: email,
    subject: 'Your referral joined Asafor VTU',
    text: `${referredName || 'Someone'} joined Asafor VTU using your referral. Any eligible reward remains subject to the active referral campaign rules.`,
    html: `<p>Hello ${name || 'there'},</p><p><strong>${referredName || 'Someone'}</strong> joined Asafor VTU using your referral.</p><p>Any reward is subject to the active campaign dates, budget, and qualifying purchase rules.</p>`
  });
}

async function sendAccountSecurityEmail({ email, name, action }) {
  return sendEmail({
    to: email,
    subject: `Asafor VTU security update: ${action}`,
    text: `Hello ${name || 'there'}, your Asafor VTU ${action} was changed. If you did not make this change, contact support immediately.`,
    html: `<p>Hello ${name || 'there'},</p><p>Your Asafor VTU <strong>${action}</strong> was changed.</p><p>If you did not make this change, contact support immediately.</p>`
  });
}

module.exports = { sendEmail, sendVerificationEmail, sendPasswordResetEmail, sendReferralSignupEmail, sendAccountSecurityEmail };
