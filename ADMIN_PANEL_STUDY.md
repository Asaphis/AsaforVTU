# Existing AsaforVTU Admin Panel Study

## Safety status

The existing admin application under `web/admin/client/` has **not been deleted, replaced, or modified** during this study. The current production admin source remains intact. The separate `web/admin-prototype/` directory is an independent simulator and is not the existing production admin panel.

## Current application structure

The admin frontend is a Vite/React application using Wouter routing, TanStack Query, shared UI components, and a DashboardLayout wrapper for authenticated pages. The root route redirects to `/dashboard` for an authenticated session or `/login` otherwise.

| Route | Page | Responsibility |
| --- | --- | --- |
| `/login` | Login | Admin sign-in and authentication bootstrap |
| `/dashboard` | Dashboard | Platform overview, metrics, chart, recent activity and system status |
| `/users` | Users | User directory, search, enrolment, suspend/restore and admin promotion actions |
| `/users/:uid` | User Profile | Individual customer profile, wallet/balances, statistics and user transaction activity |
| `/wallet` | Wallet | Wallet requests, manual credit/debit, wallet logs, deposits, payment reverification and ghost-wallet repair |
| `/transactions` | Transactions | Transaction table, filtering and navigation to transaction details |
| `/transactions/:id` | Transaction Details | Receipt, provider response, status, costs and failure diagnostics |
| `/services` | Services | Service categories, airtime networks, data plans, cable plans, electricity plans and provider synchronisation |
| `/finance` | Finance | Financial analytics, system/customer scope, provider cost, SMS cost, profit, risk, capacity and transaction-level financial data |
| `/settings/api` | API Settings | Provider credentials/settings, webhook information and payment reconciliation |
| `/support` | Support | Support tickets, ticket messages, status/replies, and announcements |
| `/logs` | Logs | Administrative/system log chronology |
| `/profile` | Profile | Administrator profile and password controls |

## Authentication and authorization

The admin frontend stores the access token through its auth helper and sends it as a Bearer token on every API request. The API adapter also sends the current user email in `X-Admin-Email` for compatibility with the existing server path, while requests explicitly omit browser credentials.

The backend admin router applies `authenticate` and `requireAdmin` to the entire `/api/admin` route group. Authentication verifies the JWT, loads the user from PostgreSQL, requires an active account, and authorizes administrators through `is_admin`, the `admin` role, or the configured `ADMIN_EMAILS` allow-list. Access tokens default to seven days and refresh tokens default to thirty days, controlled by environment variables.

## Verified API adapter contract

The existing frontend adapter uses relative URLs, so the deployed admin host is expected to proxy `/api/admin/*` to the backend. The adapter parses successful JSON responses and throws the raw response text for non-2xx responses.

| Capability | Frontend request(s) |
| --- | --- |
| Dashboard | `GET /api/admin/stats` and `GET /api/admin/transactions` |
| Settings/providers | `GET /api/admin/settings`, `POST /api/admin/settings`, `GET /api/admin/providers` |
| Finance | `GET /api/admin/finance/analytics`, `GET /api/admin/finance/system`, `GET /api/admin/finance/user` |
| Users | `GET /api/admin/users`, `POST /api/admin/users/create`, `POST /api/admin/users/promote`, `POST /api/admin/users/suspend`, `POST /api/admin/users/delete`, `POST /api/admin/users/password`, `POST /api/admin/users/verification-link`, `GET /api/admin/users/transactions` |
| Wallet | `POST /api/admin/wallet/credit`, `POST /api/admin/wallet/debit`, `POST /api/admin/wallet/reverify`, `POST /api/admin/wallet/fix-ghosts`, `GET /api/admin/wallet/logs`, `GET /api/admin/wallet/deposits`, wallet request list/approve/reject calls |
| Transactions | `GET /api/admin/transactions`, `GET /api/admin/transactions/:id` |
| Services/plans | Services CRUD, plans CRUD, and `POST /api/admin/plans/sync` |
| Support | Ticket list, ticket messages, create, reply, status, delete |
| Announcements | List, create, delete |
| Administrators | `GET /api/admin/admins`, `POST /api/admin/admins` |
| Profile | `GET /api/admin/profile`, profile update and password change |
| Reconciliation | `POST /api/admin/payments/reconcile` |

## Backend route verification and mismatches to resolve before replacement

The existing `adminRoutes.js` exposes most of the adapter surface, but the study identified several adapter calls that require explicit verification before any UI replacement is connected to live data.

| Adapter call | Route status in the inspected `adminRoutes.js` | Risk |
| --- | --- | --- |
| `POST /api/admin/users/delete` | Not visible in the inspected route list | Delete-user action may return 404 unless mounted elsewhere |
| `POST /api/admin/users/password` | Not visible in the inspected route list | Admin reset-password action may not reach a handler |
| `GET /api/admin/wallet/requests` | Not visible in the inspected route list | Wallet request list may be disconnected from this router |
| `POST /api/admin/wallet/requests/:id/approve` | Not visible in the inspected route list | Approval action may be disconnected |
| `POST /api/admin/wallet/requests/:id/reject` | Not visible in the inspected route list | Rejection action may be disconnected |
| `POST /api/admin/plans/sync` | Not visible in the inspected route list | Provider plan synchronisation may be disconnected |

These are findings for verification, not assumptions that the routes do not exist elsewhere. No destructive change has been made while these are unresolved.

## Database/data model verified

The initial schema contains the principal operational tables: `users`, `wallets`, `wallet_transactions`, `services`, `service_plans`, `transactions`, `payments`, `support_tickets`, `support_messages`, `announcements`, `settings`, `referrals`, `notifications`, `admin_audit_log`, `password_reset_tokens`, `email_verification_tokens`, and `refresh_tokens`. The later `002_support_attachments.sql` migration adds `support_attachments`.

The core operational relationships are as follows. Users own wallets and transactions. Wallet changes are represented in wallet transactions. Service and payment activity is represented in transactions and payments. Support messages belong to support tickets. Announcements and notifications are separate user-facing communication records. Administrative side effects are intended to be captured in `admin_audit_log`. Finance analytics aggregate transactions, provider costs, SMS costs, wallet liquidity and net contribution.

## Workflow mapping

| Workflow | Expected side effects |
| --- | --- |
| Admin credits wallet | Wallet balance update, wallet transaction, user-facing transaction/activity record, audit event, and notification where supported |
| Admin debits wallet | Wallet balance decrease, wallet transaction, audit event and activity record |
| Funding request approval | Payment/wallet verification, wallet credit, transaction/activity record, audit event and notification |
| Payment reconciliation | Provider/payment status confirmation, possible wallet credit, transaction status update, audit event and notification |
| User suspension | User active-state change and administrative audit record |
| Service/plan update | Service or plan record update and administrative audit record |
| Support reply/status | Support message or ticket status persistence, admin audit record, and user notification where configured |
| Announcement | Announcement record creation/deletion with audience/priority semantics |
| Admin profile/password | Administrator user/profile update and password/security change record |

## What is understood and what remains to verify

The existing admin panel is understood at the page, route, adapter, authentication, schema, and intended workflow levels. The main remaining verification work is a protected endpoint smoke test using an administrator session, together with direct comparison of each returned response shape against the page’s rendering assumptions. The route gaps listed above must be resolved or explicitly mapped before a replacement frontend is connected.

No deletion, replacement, migration reset, or production admin deployment was performed during this study. The existing admin panel is safe to continue using while the user reviews this report.
