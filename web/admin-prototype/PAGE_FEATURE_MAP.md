# Ferixas Admin Simulator Feature Map

The authenticated simulator replaces the prior prototype. Every screen is deliberately grouped by its current live administrative responsibility and uses `mockApi.js` as its only source of records and state changes.

| Navigation module | Simulator screen responsibilities | Existing backend capability boundary |
| --- | --- | --- |
| Command Center | User count, aggregate wallet liquidity, successful flow, success rate, pending attention count, revenue trend, system health, recent activity | `/api/admin/stats`, `/api/admin/transactions` |
| Customers | Directory search, account details, enrolment, verification, reset-password request, suspend/restore, wallet entry point | `/api/admin/users`, create, verification link, password, suspend, delete and transaction routes |
| Wallet Operations | Funding request review, manual main/cashback/referral wallet credit/debit, wallet activity, ghost wallet scan/repair | `/api/admin/wallet/requests/*`, credit, debit, deposits, logs and fix-ghosts routes |
| Transactions | Search, type/status filtering, receipt, full transaction/provider detail and failure diagnostics | `/api/admin/transactions` and `/api/admin/transactions/:id` |
| Services & Pricing | Categories, airtime network discount/availability, data/cable/electricity plans, retail/API price, plan creation/edit and provider synchronisation | Service CRUD, plans CRUD/sync and settings routes |
| Financial Intelligence | System/customer scope, reporting period, provider funding obligation, wallet balance, gross flow, provider cost, SMS cost, net profit, contribution trend, period table, margin ledger/failure data, customer finance/risk/capacity | `/api/admin/finance/analytics`, `/api/admin/finance/system`, `/api/admin/finance/user`, users and plans routes |
| Support & Broadcasts | Ticket inbox, same-ticket message thread, reply, status update, delete, announcement publish/delete | `/api/admin/support/tickets/*`, `/api/admin/announcements` |
| Platform Controls | Provider endpoint/key/secret, webhook, cashback/referral settings, payment reconciliation and admin invitations | `/api/admin/settings`, `/api/admin/payments/reconcile`, `/api/admin/admins` |
| Audit Trail | Chronological state-change record | Existing transaction/audit source and future explicit audit endpoint |
| My Account | Administrator profile and password | `/api/admin/profile`, `/api/admin/profile/update`, `/api/admin/profile/password` |

## Financial Intelligence completeness checklist

| Required financial signal | Present in the new simulator |
| --- | --- |
| System and specific-customer scope | Yes |
| Daily, weekly and monthly successful-flow performance | Yes |
| Reporting-period switch | Yes |
| Provider balance/funding obligation | Yes |
| Main wallet liquidity | Yes |
| Gross successful flow, provider cost, SMS cost and net profit | Yes |
| Margin transaction ledger | Yes |
| Service/user price, provider cost, SMS cost and net per record | Yes |
| Transaction status plus failure source and failure reason | Yes |
| Customer wallet, deposits/spend representation, net/risk context | Yes |
| Active-plan purchase capacity by API price | Yes |

The mock data is intentionally realistic and stateful but not production data. Replacing the mock repository with the live adapter must preserve the displayed fields, transaction semantics and confirmation behavior.
