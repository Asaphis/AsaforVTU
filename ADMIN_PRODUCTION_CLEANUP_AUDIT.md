# AsaforVTU Admin Production Cleanup Audit

## Scope

This audit covers the replacement administration dashboard at `web/admin/`. Its purpose is to ensure that the former simulator has no mock records, fake credentials, local-only administrative mutations, simulated success states, or browser-visible provider secrets before it is treated as a production administrator frontend.

## Mock data and simulator logic identified

| Area | Current simulator artifact | Required production treatment |
| --- | --- | --- |
| Authentication | Hard-coded administrator email and password in `mockApi.js`; local fake session | Remove the credential and fake login; authenticate only through `POST /api/auth/login`, retain only server-issued tokens in browser session storage, and clear them on logout/expiry. |
| Dashboard | Synthetic users, wallet balances, seven-day values, transactions, funding queue and ticket counts | Source from `/api/admin/stats`, `/api/admin/transactions`, `/api/admin/wallet/deposits`, and `/api/admin/support/tickets`. |
| Customers | Fake customer directory, balances, verification state and account changes | Source from `/api/admin/users`, user transactions, user verification-link generation, suspension and administrator-controlled wallet endpoints. |
| Wallet operations | Locally approved/rejected funding, client-side balance changes and fake ghost-wallet results | Source deposits and logs from backend; use backend credit/debit, payment reconciliation and ghost-wallet repair endpoints only. No browser-side balance mutation is permitted. |
| Transactions | Synthetic transaction ledger, details, provider response, costs and failure reasons | Source list and detail records from `/api/admin/transactions` and `/api/admin/transactions/:id`. |
| Services and plans | Fake service catalog, network settings, plan list and successful provider synchronisation claim | Source services, settings and plans from authenticated admin endpoints. Any unsupported provider sync action must not claim success. |
| Finance | Locally calculated flow, cost, capacity and risk figures from fake records | Source from `/api/admin/finance/analytics`, with dashboard derivations only from its returned data. |
| Support and broadcasts | Fake ticket threads, replies, status changes and announcements | Source only from backend support ticket/message/status/delete and announcement endpoints. |
| Platform controls | Fake provider endpoint/API-key/secret-key values and fake settings write | Do not expose provider credentials in frontend. Render settings only from approved safe fields; write only supported settings fields to `/api/admin/settings`. |
| Administrators/profile | Fake administrators, profile, password changes and audit events | Source from backend admin/profile routes. Use real profile/password endpoints and backend audit-log records. |
| Interface labels | “Simulator”, “Simulation workspace”, “local only”, sample/demo account labels | Remove from rendered production UI and from deployed documentation. |

## Security requirements for the production adapter

The frontend must not contain embedded backend keys, provider keys, passwords, test customer information, static fake administrator details, mock transaction records, or static webhook secrets. The browser must call same-origin `/api/*` only. The admin server must proxy that request to the configured backend origin, forwarding only the caller’s Bearer token and relevant request metadata.

The existing backend remains the authorization boundary. Every administrative request is authenticated by JWT and then checked for an active user with administrative authorization. The frontend must never regard a local UI role flag as authorization.

The live adapter will use session storage for the access token, refresh token, and minimal signed-in profile. It will never store credentials. On a 401 response it will attempt one refresh using the stored refresh token; if that fails it will erase the session and return to the sign-in screen.

## Backend capability boundaries discovered

The backend supports sign-in, stats, users, wallet adjustments, transaction lists/details, finance analytics, services, plans, support, announcements, settings, reconciliation, administrators, profile/password, wallet logs/deposits, payment reverification, and ghost-wallet repair.

The previously simulated “approve/reject funding” and “provider plan synchronisation” actions do not have matching safe admin routes in the inspected backend router. The production frontend must not fake either result. Funding review will use provider reconciliation/reverification. Plan sync will be hidden or reported as unavailable until a verified backend synchronisation endpoint exists.

The backend stores administrator wallet credit/debit events in `admin_audit_log`, but it does not currently expose a list route. A read-only administrator audit endpoint is needed to make the audit screen live rather than fabricated.

## Required completion criteria

Production cleanup is complete only when `mockApi.js` is removed, hard-coded mock values are absent from deployed JavaScript, local fake mutations are removed, every rendered record comes from a real API response, unsupported workflows are not presented as completed, settings never display provider secrets, and unauthenticated requests cannot render protected dashboard data.
