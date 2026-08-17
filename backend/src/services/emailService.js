const frontendUrl = () => (
  process.env.FRONTEND_URL ||
  process.env.NEXT_PUBLIC_APP_URL ||
  process.env.APP_URL ||
  'https://vtu.ferixas.com'
).replace(/\/$/, '');

const emailFrom = () => process.env.EMAIL_FROM || process.env.RESEND_FROM || 'AsaforVTU <notifications@asaforvtu.com>';
const supportInbox = () => process.env.SUPPORT_EMAIL || process.env.SUPPORT_NOTIFICATION_EMAIL || process.env.REPLY_TO_EMAIL || process.env.ADMIN_EMAIL || '';
const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[character]));
const companyName = () => process.env.COMPANY_NAME || 'AsaforVTU';
const contactEmail = () => supportInbox() || process.env.CONTACT_EMAIL || 'support@asaforvtu.com';
const renderBrandedEmail = content => {
  const base = frontendUrl();
  return `<!doctype html><html><body style="margin:0;background:#f4f7fb;font-family:Arial,Helvetica,sans-serif;color:#152238"><div style="max-width:640px;margin:0 auto;padding:28px 16px"><div style="background:#082b5f;border-radius:18px 18px 0 0;padding:24px 28px;color:#fff"><div style="font-size:20px;font-weight:700;letter-spacing:.4px">${escapeHtml(companyName())}</div><div style="font-size:12px;opacity:.82;margin-top:5px">Secure digital services for everyday transactions</div></div><main style="background:#fff;padding:30px 28px;border:1px solid #e2e8f0;border-top:0">${content}</main><footer style="padding:22px 10px;text-align:center;color:#64748b;font-size:12px;line-height:1.6"><p style="margin:0 0 8px"><a href="${escapeHtml(base)}" style="color:#087f9e;text-decoration:none">Open AsaforVTU</a> · <a href="${escapeHtml(base)}/support" style="color:#087f9e;text-decoration:none">Contact support</a> · <a href="${escapeHtml(base)}/about" style="color:#087f9e;text-decoration:none">About us</a></p><p style="margin:0">${escapeHtml(companyName())} · ${escapeHtml(contactEmail())}</p><p style="margin:8px 0 0">This is a service message related to your account. Please do not reply if you did not request it.</p></footer></div></body></html>`;
};
const renderBrandedText = text => `${text || ''}\n\n${companyName()}\nOpen AsaforVTU: ${frontendUrl()}\nSupport: ${contactEmail()}`;

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
      body: JSON.stringify({
        from: emailFrom(),
        to: [to],
        subject,
        html: renderBrandedEmail(html),
        text: renderBrandedText(text),
        ...(supportInbox() ? { reply_to: supportInbox() } : {}),
        tags: [{ name: 'category', value: 'asaforvtu-transactional' }]
      })
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
    console.info(`[Email:development] ${to} :: ${subject}\n${renderBrandedText(text || html)}`);
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

module.exports = { sendEmail, sendVerificationEmail, sendPasswordResetEmail, sendReferralSignupEmail, sendAccountSecurityEmail, sendSupportTicketCreatedEmail, sendSupportTeamTicketEmail, sendSupportFirstReplyEmail, sendSupportStatusEmail };
