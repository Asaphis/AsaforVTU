# Ferixas AsaforVTU Admin Prototype

This is a **separate simulation prototype** for the administrator interface. It does not alter the current production admin application and it does not call production APIs. Its sole purpose is to approve the page layout, page responsibilities, and interaction flow before the live adapter replaces the simulated repository.

Run the prototype through a static server, for example `npx serve -l 4173 .`, and open the returned local address. All mock records and simulated actions are isolated in `mockApi.js`.

## Design rule

> Each sidebar page contains only the functions that already belong to that page in the current admin application.

The prototype keeps visual copy brief. It uses short summaries, focused tabs, a single principal table per state, and drill-down views instead of stacking unrelated cards and controls on one page.

| Sidebar page | Prototype contents | Existing live integration boundary |
| --- | --- | --- |
| Dashboard | Four platform figures, revenue trend, system status, recent transactions | Admin statistics and recent transactions |
| User Management | Searchable account table, enrol user, profile/wallet/suspend actions | User list, create, suspend, password and verification actions |
| User Profile | Identity, balances, lifetime figures, five recent transactions | User, user finance and user transaction endpoints |
| Wallet Funding | Requests, Adjust and Logs tabs | Deposit review, credit, debit, wallet repair and wallet-log endpoints |
| Transactions | Search/filter controls, transaction table, receipt and detail actions | Transaction list and detail endpoints |
| Transaction Details | Core fields, provider status/error and raw provider response | Single transaction endpoint |
| VTU Services | Categories, Airtime, Data, Cable and Power tabs | Service, plan and settings endpoints |
| Financial Intel | Scope/date filters, finance figures, Breakdown/Historical/Capacity tabs | Finance analytics, user finance and plans endpoints |
| API Settings | Provider link, webhook URL and payment reconciliation | Settings and reconciliation endpoints |
| Support Center | Tickets and Announcements tabs; message thread only after ticket selection | Ticket, message, status and announcement endpoints |
| System Logs | One chronological audit table | Transaction-derived logs endpoint |
| My Profile | Administrator identity, profile update and password update | Current-admin profile and password endpoints |

## Mock-to-live boundary

The view layer only imports `mockApi.js`. When the design is approved, replace that export with a live adapter that preserves the same method names and return shapes. The screen locations, UI state and user flows stay unchanged.

Sensitive operational actions must continue to rely on the existing live backend validation. In particular, wallet credits and debits, deposit approvals, payment reconciliation, ticket replies, service-plan changes, user suspension, and administrator profile changes must never be represented as complete until the live API confirms success.

See `PAGE_FEATURE_MAP.md` for the page-by-page mapping derived from the current administrator code, and `VALIDATION_NOTES.md` for the interaction checks performed on the simulation prototype.
