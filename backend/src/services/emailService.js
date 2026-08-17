const frontendUrl = () => (
  process.env.FRONTEND_URL ||
  process.env.NEXT_PUBLIC_APP_URL ||
  process.env.APP_URL ||
  'https://vtu.ferixas.com'
).replace(/\/$/, '');

const emailFrom = () => process.env.EMAIL_FROM || process.env.RESEND_FROM || 'AsaforVTU <notifications@asaforvtu.com>';
const supportInbox = () => process.env.SUPPORT_EMAIL || process.env.SUPPORT_NOTIFICATION_EMAIL || process.env.REPLY_TO_EMAIL || process.env.ADMIN_EMAIL || '';
const companyName = () => process.env.COMPANY_NAME || 'AsaforVTU';
const contactEmail = () => supportInbox() || process.env.CONTACT_EMAIL || 'support@asaforvtu.com';
const supportUrl = () => process.env.SUPPORT_URL || `${frontendUrl()}/support`;
const aboutUrl = () => process.env.ABOUT_URL || `${frontendUrl()}/about`;
const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[character]));

const renderBrandedEmail = (content, { preheader = 'A secure account message from AsaforVTU.' } = {}) => {
  const base = frontendUrl();
  return `<!doctype html><html lang="en"><head><meta name="x-apple-disable-message-reformatting"><meta name="color-scheme" content="light"><meta name="supported-color-schemes" content="light"><title>${escapeHtml(companyName())}</title></head><body style="margin:0;background:#eef4f7;font-family:Arial,Helvetica,sans-serif;color:#172b3a"><div style="display:none;max-height:0;overflow:hidden;opacity:0">${escapeHtml(preheader)}</div><div style="max-width:640px;margin:0 auto;padding:28px 14px"><div style="background:#062e63;border-radius:18px 18px 0 0;padding:24px 28px;color:#fff"><div style="font-size:12px;font-weight:700;letter-spacing:2px;color:#8bd8e5">ASAFORVTU</div><div style="font-size:22px;font-weight:700;margin-top:8px">Secure digital services</div><div style="font-size:13px;line-height:1.5;margin-top:6px;color:#d9e9f7">Your trusted wallet and everyday services platform.</div></div><main style="background:#fff;padding:30px 28px;border:1px solid #dce7ed;border-top:0;border-radius:0 0 14px 14px;line-height:1.65;font-size:15px">${content}</main><footer style="padding:22px 8px;text-align:center;color:#647785;font-size:12px;line-height:1.6"><p style="margin:0 0 9px"><a href="${escapeHtml(base)}" style="color:#087f9e;text-decoration:none;font-weight:700">Open AsaforVTU</a><span style="color:#b1bec5"> &nbsp;·&nbsp; </span><a href="${escapeHtml(supportUrl())}" style="color:#087f9e;text-decoration:none">Contact support</a><span style="color:#b1bec5"> &nbsp;·&nbsp; </span><a href="${escapeHtml(aboutUrl())}" style="color:#087f9e;text-decoration:none">About us</a></p><p style="margin:0">${escapeHtml(companyName())} · ${escapeHtml(contactEmail())}</p><p style="margin:8px 0 0;color:#84939c">This is a transactional service message related to your account. If you did not request it, contact support.</p></footer></div></body></html>`;
};

const renderBrandedText = text => `${text || ''}\n\n${companyName()}\nOpen AsaforVTU: ${frontendUrl()}\nSupport: ${supportUrl()}\nContact: ${contactEmail()}`;
const actionButton = (label, url) => `<p style="margin:24px 0"><a href="${escapeHtml(url)}" style="display:inline-block;background:#087f9e;color:#fff;text-decoration:none;font-weight:700;padding:12px 20px;border-radius:8px">${escapeHtml(label)}</a></p><p style="font-size:12px;color:#71808b;word-break:break-all">If the button does not work, copy this link:<br>${escapeHtml(url)}</p>`;
const infoCard = content => `<div style="background:#f3f8fa;border-left:4px solid #087f9e;padding:14px 16px;margin:20px 0">${content}</div>`;

async function sendEmail({ to, subject, html, text, preheader = 'A secure account message from AsaforVTU.' }) {
  if (!to) throw new Error('Recipient email is required');
  if (process.env.RESEND_API_KEY) {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: emailFrom(),
        to: [to],
        subject,
        html: renderBrandedEmail(html, { preheader }),
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
  if (process.env.NODE_ENV === 'production') throw new Error('RESEND_API_KEY is required for production email delivery');
  console.info(`[Email:development] ${to} :: ${subject}\n${renderBrandedText(text || html)}`);
  return { delivered: false, development: true };
}

async function sendVerificationEmail({ email, token }) {
  const link = `${frontendUrl()}/verify-email?token=${encodeURIComponent(token)}`;
  return sendEmail({ to: email, subject: 'Verify your AsaforVTU account', preheader: 'Complete your AsaforVTU email verification.', text: `Welcome to AsaforVTU. Verify your account here: ${link}. This link expires in 24 hours.`, html: `<h1 style="margin:0 0 12px;color:#062e63;font-size:25px">Verify your account</h1><p>Welcome to AsaforVTU. Confirm your email address to keep your account secure and start using our services.</p>${actionButton('Verify email address', link)}${infoCard('<strong>Security note:</strong> This verification link expires in 24 hours and should not be shared.')}` });
}

async function sendPasswordResetEmail({ email, token }) {
  const link = `${frontendUrl()}/reset-password/${encodeURIComponent(token)}`;
  return sendEmail({ to: email, subject: 'Reset your AsaforVTU password', preheader: 'Use the secure link to reset your AsaforVTU password.', text: `Reset your AsaforVTU password here: ${link}. This link expires in 1 hour.`, html: `<h1 style="margin:0 0 12px;color:#062e63;font-size:25px">Reset your password</h1><p>We received a request to reset the password for your AsaforVTU account.</p>${actionButton('Reset password', link)}${infoCard('<strong>Did not request this?</strong> You can ignore this email. Your password will not change unless the link is used.')}` });
}

async function sendReferralSignupEmail({ email, name, referredName }) {
  const who = escapeHtml(referredName || 'Someone');
  return sendEmail({ to: email, subject: 'Your referral joined AsaforVTU', preheader: 'A referral update from AsaforVTU.', text: `${referredName || 'Someone'} joined AsaforVTU using your referral. Any eligible reward remains subject to active campaign rules.`, html: `<h1 style="margin:0 0 12px;color:#062e63;font-size:25px">Your referral joined</h1><p>Hello ${escapeHtml(name || 'there')},</p><p><strong>${who}</strong> joined AsaforVTU using your referral.</p>${infoCard('Any eligible reward remains subject to the active campaign dates, budget, and qualifying purchase rules.')}<p>Thank you for helping more people discover AsaforVTU.</p>` });
}

async function sendAccountSecurityEmail({ email, name, action }) {
  const safeAction = escapeHtml(action);
  return sendEmail({ to: email, subject: `AsaforVTU security update: ${action}`, preheader: `Your AsaforVTU account security settings changed: ${action}.`, text: `Hello ${name || 'there'}, your AsaforVTU ${action} was changed. If you did not make this change, contact support at ${contactEmail()}.`, html: `<h1 style="margin:0 0 12px;color:#062e63;font-size:25px">Security update</h1><p>Hello ${escapeHtml(name || 'there')},</p><p>Your AsaforVTU <strong>${safeAction}</strong> was changed successfully.</p>${infoCard(`<strong>If you did not make this change:</strong> Contact ${escapeHtml(contactEmail())} immediately and secure your account.`)}` });
}

async function sendSupportTicketCreatedEmail({ email, name, subject, ticketId }) {
  return sendEmail({ to: email, subject: `Support ticket received: ${subject}`, preheader: 'Your AsaforVTU support request has been received.', text: `Hello ${name || 'there'}, your support ticket "${subject}" was received. Ticket ID: ${ticketId}.`, html: `<h1 style="margin:0 0 12px;color:#062e63;font-size:25px">Support request received</h1><p>Hello ${escapeHtml(name || 'there')},</p><p>We received your support request and our team will review it.</p>${infoCard(`<strong>Subject:</strong> ${escapeHtml(subject)}<br><strong>Ticket ID:</strong> ${escapeHtml(ticketId)}`)}<p>You can follow up from the Support section of your account.</p>` });
}

async function sendSupportTeamTicketEmail({ subject, ticketId, customerName, customerEmail }) {
  const to = supportInbox();
  if (!to) return { delivered: false, skipped: true };
  return sendEmail({ to, subject: `New support ticket: ${subject}`, preheader: 'A new customer support ticket needs attention.', text: `A new support ticket was opened by ${customerName || 'a customer'} (${customerEmail || 'no email'}). Subject: ${subject}. Ticket ID: ${ticketId}.`, html: `<h1 style="margin:0 0 12px;color:#062e63;font-size:25px">New support ticket</h1><p>A customer opened a new support request.</p>${infoCard(`<strong>Customer:</strong> ${escapeHtml(customerName || 'Unknown')} (${escapeHtml(customerEmail || 'unknown')})<br><strong>Subject:</strong> ${escapeHtml(subject)}<br><strong>Ticket ID:</strong> ${escapeHtml(ticketId)}`)}<p>Open the admin Support centre to review and respond.</p>` });
}

async function sendSupportFirstReplyEmail({ email, name, subject, ticketId }) {
  return sendEmail({ to: email, subject: `Support replied to your ticket: ${subject}`, preheader: 'Your AsaforVTU support ticket has a new reply.', text: `Hello ${name || 'there'}, support has replied to your ticket "${subject}". Ticket ID: ${ticketId}. Sign in to view the reply.`, html: `<h1 style="margin:0 0 12px;color:#062e63;font-size:25px">Support replied</h1><p>Hello ${escapeHtml(name || 'there')},</p><p>Our support team has replied to your ticket <strong>${escapeHtml(subject)}</strong>.</p>${infoCard(`<strong>Ticket ID:</strong> ${escapeHtml(ticketId)}`)}<p>Sign in to your account to read the full reply and continue the conversation.</p>${actionButton('Open support', supportUrl())}` });
}

async function sendSupportStatusEmail({ email, name, subject, ticketId, status }) {
  return sendEmail({ to: email, subject: `Support ticket updated: ${subject}`, preheader: `Your AsaforVTU support ticket status is now ${status}.`, text: `Hello ${name || 'there'}, your support ticket "${subject}" is now ${status}. Ticket ID: ${ticketId}.`, html: `<h1 style="margin:0 0 12px;color:#062e63;font-size:25px">Support ticket updated</h1><p>Hello ${escapeHtml(name || 'there')},</p><p>Your support ticket <strong>${escapeHtml(subject)}</strong> is now <strong>${escapeHtml(status)}</strong>.</p>${infoCard(`<strong>Ticket ID:</strong> ${escapeHtml(ticketId)}`)}<p>Visit Support in your account for the latest details.</p>` });
}

module.exports = { sendEmail, sendVerificationEmail, sendPasswordResetEmail, sendReferralSignupEmail, sendAccountSecurityEmail, sendSupportTicketCreatedEmail, sendSupportTeamTicketEmail, sendSupportFirstReplyEmail, sendSupportStatusEmail };
