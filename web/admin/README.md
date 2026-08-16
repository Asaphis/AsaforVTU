# AsaforVTU Admin Dashboard

This directory contains the production administrator dashboard for AsaforVTU. It is served as a lightweight Node.js application and uses same-origin `/api/*` requests. The server forwards those requests to the configured backend service, preserving the caller’s Bearer token while keeping backend URLs and provider credentials out of browser code.

## Runtime configuration

| Variable | Purpose |
| --- | --- |
| `PORT` | Local listening port. The current Nginx configuration routes the administrator hostname to port `5003`. |
| `VTU_BACKEND_URL` | Private or public URL of the existing backend API. |
| `BACKEND_URL` | Supported alternative backend URL variable. |

The production runtime should use a process manager such as PM2. The Nginx proxy remains the public entry point; the Node process is not intended to be internet-facing directly.

## Authentication

Administrators sign in through the existing `POST /api/auth/login` endpoint. The dashboard requires the backend to return an active administrator account with either `is_admin` enabled or the `admin` role. Browser state contains only short-lived session data and server-issued tokens held in session storage. Credentials, provider secrets, webhook addresses, mock records, and static administrator accounts are not stored in the frontend.

## Live integration boundary

The dashboard routes customer, wallet, transaction, service, financial-intelligence, support, settings, reconciliation, administrator profile, and audit functions through protected `/api/admin/*` endpoints. The backend remains responsible for authentication, authorization, financial mutation, payment reconciliation, notifications, audit logging, and provider interaction.

Unsupported server capabilities must report an unavailable state rather than simulate a completed action. In particular, provider plan synchronization is not displayed as successful without a verified backend route.
