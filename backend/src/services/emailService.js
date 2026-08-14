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

module.exports = { sendEmail, sendVerificationEmail, sendPasswordResetEmail };
