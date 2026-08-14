# Email delivery diagnosis

The Resend welcome email is not proof that the AsaforVTU backend sent its verification email. The application sends mail only through `backend/src/services/emailService.js`, which reads `RESEND_API_KEY`, `EMAIL_FROM`/`RESEND_FROM`, and `FRONTEND_URL`, then POSTs to `https://api.resend.com/emails`.

The sender default is `no-reply@asaforvtu.com`. If production has not set `EMAIL_FROM=noreply@ferixas.com`, Resend can reject the application message even though the `ferixas.com` domain is verified. The repaired code throws when `RESEND_API_KEY` is absent in production, but registration catches the error and returns `verification_sent: false`; the resend endpoint intentionally returns a generic success response and logs the real error. This can make the API appear successful while no email was delivered.

The backend app loads dotenv from the process working directory via `dotenv.config()`. A PM2 process started with the wrong working directory or without the current `.env` can therefore lack the Resend variables. The server must be restarted after private environment configuration, and the PM2 logs must be checked for `Verification email delivery failed`, `Resend verification email failed`, `RESEND_API_KEY is required`, or `Email provider rejected request`.

The correct production settings are `RESEND_API_KEY=<private replacement key>`, `EMAIL_FROM=noreply@ferixas.com`, `FRONTEND_URL=https://vtu.ferixas.com`, and `NODE_ENV=production`. The sender domain must be verified in Resend. A new disposable unverified test account should be used for end-to-end verification; already verified accounts are intentionally skipped by the resend service.
