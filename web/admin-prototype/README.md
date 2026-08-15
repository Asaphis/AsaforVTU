# Ferixas Operations Command Prototype

This is a **separate, standalone prototype** for a redesigned AsaforVTU administrator interface. It does not replace the current `web/admin` implementation and it never calls production APIs. Open it through a static server, for example `npx serve -l 4173 .`, then visit `http://localhost:4173`.

The visual system uses the same Ferixas/AsaforVTU brand assets as the customer product: a deep navy operations shell, Ferixas globe mark, high-contrast white command surfaces, and lime highlights for active and healthy states. The design deliberately differs from the existing white/slate control center while preserving its operating scope.

## Integration architecture

The screen code depends only on `mockApi.js`. It contains realistic in-memory records and each operation returns the same kind of entity the future live backend should return. Integration consists of replacing the exported `mockApi` with a `liveApi` implementation that keeps the same method names, arguments, and result shapes; the UI pages do not need to be redesigned or moved.

| Prototype method | Existing live administrative capability | Prototype behavior |
| --- | --- | --- |
| `getOverview()` | System statistics, financial analytics, transaction history | Command metrics, attention queue, activity feed |
| `listUsers()` / `updateUser()` | User listing, profile, suspend/activate, delete, password reset, verification link | Customer directory and profile drawer |
| `creditWallet()` | Admin wallet credit | Simulates ledger entry, transaction activity, receipt, and notification |
| `listDeposits()` / `updateDeposit()` | Wallet funding request review, approve, reject | Deposit-review queue and decision actions |
| `listTransactions()` / `reconcile()` | Transaction details and provider payment reconciliation | Activity table, receipt drawer, reconciliation action |
| `listServices()` / `updateService()` | Create, edit, delete, and enable services | Service availability and configuration cards |
| `listPlans()` | Create, edit, delete, sync provider plans | Service-plan pricing and margin table |
| `listTickets()` / `replyTicket()` / `updateTicket()` | Support ticket list, same-ticket messages, reply, status, delete | Three-pane support conversation workspace |
| `listAnnouncements()` / `createAnnouncement()` | Announcement list, publish, delete | Customer communication management |
| `listAdmins()` | List and create administrators | Administrator governance panel |
| `listLogs()` | Wallet/audit/system logs | Audit trail and operational review |
| `listNotifications()` / `markNotificationsRead()` | Notification event visibility | Operations notification drawer |

## Feature coverage map

| Current admin area | Included in prototype | Key design treatment |
| --- | --- | --- |
| Dashboard | Yes | Operational overview, system health, attention queue, live activity, notification signals |
| User management and profile | Yes | Search-ready customer table, customer drawer, wallet, referral, verification, access controls |
| Wallet funding and wallet audit | Yes | Deposit approvals/rejections, manual credit, reconciliation, ghost-wallet-safe scan, ledger feed |
| Transactions and receipts | Yes | Activity table, status filters, receipt details, provider reconciliation affordance |
| Finance | Yes | Volume, provider cost, margin, exceptions, system and user finance integration surface |
| VTU services and plans | Yes | Service state, pricing, network, provider price, customer price, margin, sync controls |
| Support center | Yes | Ticket queue, real conversation panel, customer context, reply and ticket-status controls |
| Announcements and admins | Yes | Customer announcements, administrator accounts, audit history |
| API/provider settings | Yes | Provider cards, webhook security, notification/referral/availability control categories |
| Logs and profile/security | Yes | Audit stream, administrator profile, two-factor and approval confirmation controls |

## Prototype usage

The prototype supports these interactive simulations:

1. Open a customer to inspect account, wallet, referral, verification, and access details.
2. Credit a wallet from the wallet screen or customer drawer. The simulated balance, transaction activity, audit event, and notification update together.
3. Approve or reject a deposit review.
4. Open a receipt and run simulated provider reconciliation.
5. Configure service availability and inspect customer/provider pricing margins.
6. Select a support ticket, reply in the **same** thread, and change ticket status. The message, ticket state, and notification event update together.
7. Publish an announcement and inspect administrator/audit panels.
8. Open the notification drawer and mark all operations alerts read.

## Integration guardrails

The `Simulator mode` chip must be removed only when `mockApi.js` is replaced with a reviewed authenticated live adapter. Live integration must preserve the existing backend validation requirements for administrator authorization, wallet idempotency, provider verification, transaction status, notification creation, ticket ownership, and attachment handling. The prototype never claims an action succeeded until the adapter returns a confirmed result.
