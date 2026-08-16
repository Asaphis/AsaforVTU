# AsaforVTU Admin Dashboard Architecture

## Purpose

The replacement is a complete front-end simulation of the current VTU administration platform. It begins at an authenticated login screen, uses stateful realistic mock records, and keeps all data access behind one repository module. The interface can therefore be connected to the live `/api/admin/*` routes later without rebuilding the views.

## Authentication simulation

The simulator starts at a login page. A successful simulator login stores a minimal session descriptor in browser storage and opens the authenticated application shell. Sign out clears the descriptor and returns to login. The demo account is intentionally limited to the simulator and is not a production credential.

| Item | Simulator behavior | Future live replacement |
| --- | --- | --- |
| Sign in | Validates the local simulator administrator and creates a local session | Existing administrator authentication and token/session storage |
| Route guard | App shell renders only with a simulator session | Existing authenticated route guard |
| Sign out | Clears simulator session and restores the login screen | Existing logout flow |
| Administrator profile | Updates simulated display name and communication number | `/api/admin/profile/update` and `/api/admin/profile/password` |

## Application sections

| Section | Focused responsibilities |
| --- | --- |
| Command Center | Platform health, user count, wallet liquidity, successful transaction volume, trend, and concise live queue |
| Customers | Search, filters, lifecycle status, customer drawer, wallet shortcut, suspend/restore, password and verification actions |
| Wallet Operations | Funding request decisions, main/cashback/referral credit or debit, wallet logs, deposit ledger, ghost-wallet dry run/repair |
| Transactions | Filters, transaction rows, receipt panel, full provider result and failure diagnostics |
| Services & Pricing | Service categories, airtime availability/discounts, data/cable/power plans, user/API pricing and provider plan synchronisation |
| Financial Intelligence | System or customer scope, date filter, provider funding obligation, total wallet liquidity, gross successful flow, provider cost, SMS cost, net profit, daily/weekly/monthly figures, transaction-margin table, failure source/reason, customer wallet/finance/risk capacity |
| Support & Broadcasts | Ticket inbox, thread replies, ticket status, announcement creation and deletion |
| Platform Controls | Provider endpoint/API settings, webhook address, referral budget/cashback state, payment reconciliation, administrator accounts |
| Audit Trail | Chronological action record |
| My Account | Administrator profile and password update |

## Financial Intelligence coverage

The Financial Intelligence module simulates every metric and row exposed by the current finance adapter.

| Backend contract field | Simulator presentation |
| --- | --- |
| `scope` | System or selected customer scope switch |
| `providerBalanceRequired` | Provider obligation card and funding-health indicator |
| `walletBalance` / `totalWalletBalance` | Wallet liquidity card |
| `daily`, `weekly`, `monthly` | Period performance switch with deposits, provider cost, SMS cost, and net profit |
| `totals` | Gross successful flow, provider cost, SMS cost, and net profit summary |
| `transactions` | Margin ledger with customer, service, user price, provider cost, SMS cost, net, status, failure source, failure reason, and timestamp |
| Customer finance/risk | Customer deposits, spend, provider/SMS cost, profit, expected profit and transaction capacity by active plan |

## Mock-to-live adapter boundary

`mockApi.js` remains the sole source of simulator data and side effects. The future live adapter must preserve method intent and response shape for: authentication, dashboard statistics, customers, wallet funding and adjustments, deposits and logs, transactions and transaction detail, services and plans, finance analytics/system/user, support, announcements, settings, reconciliation, administrators, profile, and audit logs.

No payment, wallet, user, or support action is presented as a production result. The simulator labels its environment in the application shell and shows state changes as simulated until a live adapter is connected.
