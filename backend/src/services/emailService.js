const frontendUrl = () => (
  process.env.FRONTEND_URL ||
  process.env.NEXT_PUBLIC_APP_URL ||
  process.env.APP_URL ||
  'http://localhost:3000'
).replace(/\/$/, '');

const emailFrom = () => process.env.EMAIL_FROM || process.env.RESEND_FROM || 'no-reply@asaforvtu.com';
const supportInbox = () => process.env.SUPPORT_EMAIL || process.env.SUPPORT_NOTIFICATION_EMAIL || process.env.ADMIN_EMAIL || '';
const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[character]));

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

async function sendVerificationOtpEmail({ email, name, code }) {
  return sendEmail({
    to: email,
    subject: `${code} is your Asafor VTU verification code`,
    text: `Hello ${name || 'there'}, your Asafor VTU verification code is ${code}. It expires in 5 minutes. Do not share this code with anyone.`,
    html: `<p>Hello ${escapeHtml(name || 'there')},</p><p>Use this verification code to activate your Asafor VTU account:</p><p style="font-size:32px;font-weight:700;letter-spacing:8px">${escapeHtml(code)}</p><p>This code expires in <strong>5 minutes</strong> and can be used once. Do not share it with anyone.</p>`
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
    html: `<p>Hello ${escapeHtml(name || 'there')},</p><p>Your Asafor VTU <strong>${escapeHtml(action)}</strong> was changed.</p><p>If you did not make this change, contact support immediately.</p>`
  });
}

async function sendSupportTicketCreatedEmail({ email, name, subject, ticketId }) {
  return sendEmail({
    to: email,
    subject: `Support ticket received: ${subject}`,
    text: `Hello ${name || 'there'}, your support ticket "${subject}" was received. Ticket ID: ${ticketId}.`,
    html: `<p>Hello ${escapeHtml(name || 'there')},</p><p>Your support ticket <strong>${escapeHtml(subject)}</strong> was received.</p><p>Ticket ID: <code>${escapeHtml(ticketId)}</code></p>`
  });
}

async function sendSupportTeamTicketEmail({ subject, ticketId, customerName, customerEmail }) {
  const to = supportInbox();
  if (!to) return { delivered: false, skipped: true };
  return sendEmail({
    to,
    subject: `New support ticket: ${subject}`,
    text: `A new support ticket was opened by ${customerName || 'a customer'} (${customerEmail || 'no email'}). Subject: ${subject}. Ticket ID: ${ticketId}.`,
    html: `<p>A new support ticket was opened.</p><p><strong>Customer:</strong> ${escapeHtml(customerName || 'Unknown')} (${escapeHtml(customerEmail || 'unknown')})</p><p><strong>Subject:</strong> ${escapeHtml(subject)}</p><p><strong>Ticket ID:</strong> <code>${escapeHtml(ticketId)}</code></p>`
  });
}

async function sendSupportFirstReplyEmail({ email, name, subject, ticketId }) {
  return sendEmail({
    to: email,
    subject: `Support replied to your ticket: ${subject}`,
    text: `Hello ${name || 'there'}, support has replied to your ticket "${subject}". Ticket ID: ${ticketId}. Sign in to view the reply.`,
    html: `<p>Hello ${escapeHtml(name || 'there')},</p><p>Support has replied to your ticket <strong>${escapeHtml(subject)}</strong>.</p><p>Ticket ID: <code>${escapeHtml(ticketId)}</code>. Sign in to view the reply.</p>`
  });
}

async function sendSupportStatusEmail({ email, name, subject, ticketId, status }) {
  return sendEmail({
    to: email,
    subject: `Support ticket updated: ${subject}`,
    text: `Hello ${name || 'there'}, your support ticket "${subject}" is now ${status}. Ticket ID: ${ticketId}.`,
    html: `<p>Hello ${escapeHtml(name || 'there')},</p><p>Your support ticket <strong>${escapeHtml(subject)}</strong> is now <strong>${escapeHtml(status)}</strong>.</p><p>Ticket ID: <code>${escapeHtml(ticketId)}</code>.</p>`
  });
}

module.exports = { sendEmail, sendVerificationOtpEmail, sendPasswordResetEmail, sendReferralSignupEmail, sendAccountSecurityEmail, sendSupportTicketCreatedEmail, sendSupportTeamTicketEmail, sendSupportFirstReplyEmail, sendSupportStatusEmail };
