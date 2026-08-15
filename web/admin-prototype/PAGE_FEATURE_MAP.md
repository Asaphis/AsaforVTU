# Existing Admin Page Map for the Prototype Refactor

The prototype must retain the existing sidebar routes and keep each route focused on the functions already present there. It must not move wallet controls to the dashboard, reconciliation to finance, announcements to an audit page, or user-profile data into the user list.

| Existing sidebar page | Current responsibilities from the existing code | Concise prototype structure |
| --- | --- | --- |
| Dashboard | Four platform cards, one revenue chart, six recent transactions, online status | Four concise figures, compact revenue chart, five recent transactions. No wallet adjustment, support queue, service controls, or announcements. |
| User Management | Search users, enroll a user, list identity/email/balance/status, open profile, open wallet, suspend or restore account | Search and concise user table. Row menu contains profile, wallet, suspend/restore. User enrolment stays in a modal. |
| User Profile | Identity and status, wallet/cashback/referral balances, lifetime finance, recent transactions, shortcuts to funding and filtered transactions | A separate drill-down page with a short identity card, three balances, two lifetime figures, and a five-row activity list. |
| Wallet Funding | Funding counters, requests list, approval/rejection, manual credit, manual debit, ghost-wallet repair, wallet logs | One page with three tabs: Requests, Adjust, Logs. Manual credit/debit and repair remain only in Adjust. |
| Transactions | Search, service/status filters, export, transaction table, receipt modal, transaction detail route | Filters and one concise table only. Receipt and full provider diagnostics are opened from the row. |
| Transaction Details | Core transaction fields, provider status/error, provider raw response | A compact drill-down, separate from the transaction table. |
| Financial Intel | System/user scope, date range, three finance summaries, ecosystem breakdown, historical performance, totals, filtered transaction profitability, user capacity | Scope/date filters, three figures, concise finance breakdown and period summary. No payment-reconciliation control. |
| VTU Services | Service categories, airtime network enable/discount, data plan CRUD, cable plan CRUD, electricity provider/fee CRUD | One services page with five tabs: Categories, Airtime, Data, Cable, Electricity. Each tab contains only its related table and one create/edit control. |
| Support Center | Tickets list, selected ticket messages/reply, resolve/delete ticket, announcements create/delete | Two tabs: Tickets and Announcements. The ticket message panel appears only when a ticket is selected. |
| API Settings | Provider URL/API key/secret, webhook URL, payment reconciliation by reference | Three focused cards: Provider Link, Webhook URL, Payment Reconciliation. |
| System Logs | One transaction-derived chronology table | One concise audit table only. |
| My Profile | Administrator identity, profile details, profile save, password change | Administrator card, profile form, password form. |

The redesigned prototype may improve the visual hierarchy and interaction patterns, but it must preserve these ownership boundaries. Mock repository methods must mirror the live calls associated with the page that owns them.
