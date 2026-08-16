# AsaforVTU Admin Dashboard

This directory now contains the **complete replacement** for the former admin dashboard. It is an authenticated, stateful front-end administrator dashboard for the Ferixas AsaforVTU administration platform. The old admin dashboard layout and code path were replaced; this interface is not a visual patch of the previous design.

The administrator dashboard starts on a login screen and stores only a local browser session. It never sends the administrator dashboard credential, transactions, customer data, or wallet actions to production services.

## Administrator access

| Field | Value |
| --- | --- |
| Email | `admin@ferixas.test` |
| Password | `Admin@2026` |
| Environment | Local administrator dashboard only |

Use the **Sign out** control to return to login. Profile password changes update the administrator dashboard state for the open browser session only.

## Full feature coverage

| Module | Stateful administrator dashboard behavior | Future live administrative contract |
| --- | --- | --- |
| Command Center | Dashboard metrics, seven-day successful-flow trend, health, funding/ticket queue, recent activity | Stats and recent transaction routes |
| Customers | Search, enrolment, customer profile, verification link, password reset, suspend/restore, wallet shortcut | Users, verification, password, suspend and wallet routes |
| Wallet Operations | Funding approval/rejection, main/cashback/referral adjustment, new transaction/log creation, ghost-wallet dry run/repair | Wallet requests, credit/debit, deposits and logs routes |
| Transactions | Search/status/type filters, receipt, provider details, provider cost, SMS cost, net, failure source/reason | Transactions list and detail routes |
| Services & Pricing | Service availability, airtime configuration, plan pricing, new plan, provider-plan synchronisation | Services, settings and plan CRUD/sync routes |
| Financial Intelligence | System/customer scope, period selector, provider obligation, wallet liquidity, successful flow, provider/SMS cost, net profit, trend, daily/weekly/monthly performance, margin ledger, exceptions, customer risk and plan capacity | Finance analytics, system and customer finance routes |
| Support & Broadcasts | Ticket selection, same-thread replies, ticket statuses, ticket deletion, announcement creation/deletion | Support tickets/messages/status/delete and announcement routes |
| Platform Controls | Provider configuration, webhook copy, cashback/referral controls, payment reconciliation, administrator invitation | Settings, reconciliation and admin-access routes |
| Audit Trail | State-changing admin actions appended to chronological audit records | Administrative audit endpoint |
| My Account | Profile update and password rotation | Administrator profile/password routes |

## Adapter boundary

`mockApi.js` is the only source of data and side effects. To connect the approved interface to production, replace each method in that module with calls to the existing authenticated `/api/admin/*` endpoints while preserving the return shapes that the views use. The visual layer should not be rewritten.

The simulation makes state changes locally so a review can safely demonstrate the expected front-end behavior. In production, wallet adjustments, funding approval, reconciliation, profile/password updates, ticket actions, customer access, and service pricing must continue to display completion only after the backend returns a confirmed success response.

See `SIMULATOR_ARCHITECTURE.md` for the complete technical mapping, especially the Financial Intelligence fields and their current backend meaning. `VALIDATION_NOTES.md` records the functional checks run against the administrator dashboard.
