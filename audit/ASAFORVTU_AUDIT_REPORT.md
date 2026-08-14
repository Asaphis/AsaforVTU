# AsaforVTU Comprehensive Audit Report

**Repository:** [Asaphis/AsaforVTU](https://github.com/Asaphis/AsaforVTU)  
**Audited commit:** `0d779fd` on `main`  
**Scope:** Backend, customer frontend, admin frontend/server proxy, database migration, deployment configuration, documentation, dependency checks, and safe startup/build checks.  
**Audit status:** Static and source-level audit completed. No source files were modified.

## Executive conclusion

The repository contains several independent blockers that explain the reported symptoms. The most serious problems are not isolated UI bugs: the authentication/verification contract is inconsistent from registration through email verification; no actual email-delivery implementation exists; the customer service lookup endpoint is missing; wallet balance updates use the wrong field names; payment references are split between two local records and two different provider references; and service purchase calls use incorrect helper signatures and provider method names. The transaction PIN is checked only in the browser against a field that is not returned by the backend, so it is both nonfunctional and insecure.

The admin panel has a second integration boundary that is incomplete. The admin client calls many endpoints that the admin server proxy never registers, including service management, plan management, support, announcements, finance analytics, providers, and several user operations. Even where a request reaches the backend, several admin payloads and SQL statements do not match the PostgreSQL schema.

The source code passed JavaScript syntax checks, the backend briefly started, and both frontend production builds exited successfully. Those successful builds do **not** establish correctness: the customer Next.js configuration explicitly ignores TypeScript errors, while the admin Vite build does not run the failing TypeScript check. The customer TypeScript check and admin TypeScript check both fail.

## Severity legend

| Severity | Meaning |
|---|---|
| **P0** | Security, payment, authentication, or data-integrity blocker; fix before production use. |
| **P1** | Major user-facing workflow is unusable or an admin operation cannot work. |
| **P2** | Important correctness, observability, authorization, or maintainability defect. |
| **P3** | Documentation, dependency, UX, or lower-impact defect that should still be scheduled. |

## P0 blockers

| ID | Finding | Evidence and effect |
|---|---|---|
| **A-001** | Registration and verification have contradictory states. | [`backend/src/services/authService.js`](../backend/src/services/authService.js) comments out verification-token creation, leaves the database default `email_verified = FALSE`, but returns `email_verified: true`. The verification endpoint requires a token row that registration never creates. A new account can therefore appear verified in the response while remaining unverified in the database. |
| **A-002** | No verification or reset email delivery exists. | [`backend/src/services/authService.js`](../backend/src/services/authService.js) contains no active mail provider or `sendMail` path. The notification service only writes database rows. Password reset returns a reset token directly in the API response rather than sending a link. The frontend promise that an inbox link will arrive cannot be fulfilled. |
| **C-006** | Admin “verification link” generation is actually password-reset generation. | The admin controller’s verification-link handler calls `requestPasswordReset`, so it creates the wrong token type and exposes a reset workflow under a verification label. |
| **C-012** | Resend verification is not implemented. | [`web/frontend/src/hooks/useAuthForm.ts`](../web/frontend/src/hooks/useAuthForm.ts) destructures `verifyEmail` from the auth context even though the context does not expose it, and calls it without a token. The TypeScript check confirms this contract failure. |
| **C-008** | Logout does not meet the requested redirect behavior. | [`DashboardLayout.tsx`](../web/frontend/src/components/dashboard/DashboardLayout.tsx) and related dashboard handlers call `signOut()` and then navigate to `/`, not `/login`. The customer auth logout also awaits an unbounded network request before clearing state. If that request hangs, local state and redirect are delayed until the request completes or the page is refreshed. |
| **C-010** | Customer API defaults point to the legacy backend. | [`web/frontend/src/lib/auth.ts`](../web/frontend/src/lib/auth.ts), `services.ts`, and `AuthContext.tsx` default to `https://vtuapi.ferixas.com`. The current deployment configuration documents `https://asaforvtubackend.onrender.com` and Render supplies different variable names. Unless an overriding environment variable exists at runtime, customer authentication, wallet, payment, and service requests target the old host. |
| **D-003** | Transaction PIN verification is impossible and insecure. | [`TransactionPinModal.tsx`](../web/frontend/src/components/dashboard/TransactionPinModal.tsx) hashes the PIN with browser SHA-256 and compares it to `user.pinHash`. The backend stores the PIN with bcrypt and does not return `pinHash`. The server never verifies the PIN. Normal users will fail the comparison, and any client-side check can be tampered with. |
| **D-004** | PIN change is a false success. | [`web/frontend/src/app/dashboard/security/page.tsx`](../web/frontend/src/app/dashboard/security/page.tsx) calls `pinLoading(true)` instead of `setPinLoading(true)`, has no backend endpoint, and shows “PIN changed successfully” without persisting anything. |
| **A-004** | Wallet credits/debits can lose updates under concurrency. | [`backend/src/services/walletService.js`](../backend/src/services/walletService.js) begins a transaction on one client but reads/creates wallets through separate pool connections, does not lock the balance row with `FOR UPDATE`, and computes the new balance in JavaScript. Concurrent deposits or purchases can overwrite one another. |
| **A-005** | Payment status and wallet changes are not in one database transaction. | [`backend/src/services/paymentService.js`](../backend/src/services/paymentService.js) starts a transaction on `client`, but payment lookup/status updates, wallet operations, and transaction operations use independent pool calls. A later error can leave earlier status or balance changes committed. Concurrent verification can also credit twice because the pending row is not locked. |
| **A-006** | Flutterwave uses mismatched local/provider references. | The initiate route creates a local `PAY_...` record, then the provider service creates another `DEP-...` record and sends the latter to Flutterwave. The route returns the first reference while checkout uses the second. The callback verifies the wrong reference, which can prevent crediting or create duplicate payment rows. |
| **A-007** | Payment callback defaults to a legacy domain. | The payment route and Flutterwave adapter default to `https://vtu.ferixas.com/payment-complete`; the current frontend is documented as `https://asaforvtu.onrender.com`. Without `FLW_REDIRECT_URL`, users can be returned to the obsolete host. |
| **A-008** | VTU service resolution uses the wrong result field. | The purchase route searches `s.category`, but the plan query returns `service_category`, `service_slug`, and related fields. `serviceId` can remain null, weakening transaction linkage and producing invalid service records. |
| **A-009** | Provider calls use incorrect methods/arguments. | Data purchase passes `providerCost` where the provider adapter expects `planId`; electricity passes `providerCost` where it expects `serviceId`; cable calls `purchaseCable` although the adapter exports `purchaseCableTV`. Cable can throw a missing-method error and the other services can send invalid provider requests. |

## P1 major workflow failures

| ID | Finding | Evidence and effect |
|---|---|---|
| **D-006** | Customer service-by-slug endpoint is missing. | `getServiceBySlug()` requests `GET /api/services/:slug`, but [`backend/src/app.js`](../backend/src/app.js) defines the collection endpoint only. `useService()` can receive 404 for Airtime, Data, Cable, Electricity, and Exam PIN pages. |
| **D-007** | Active-service field names do not match. | Backend service rows expose `is_active`; several customer pages gate buttons using `service.enabled`. Active services can appear disabled or “coming soon.” |
| **D-008** | Electricity page uses `useEffect` without importing it. | [`web/frontend/src/app/dashboard/services/electricity/page.tsx`](../web/frontend/src/app/dashboard/services/electricity/page.tsx) imports only `useState` but calls `useEffect`. The TypeScript check confirms the missing symbol. |
| **C-013** | Airtime and Data call purchase helpers with the wrong signature and paths. | The shared helpers accept one payload object and post to `/api/vtu/purchase`, while the pages pass `(user.uid, amount, details)` and the helper ignores the extra arguments. The resulting request body is wrong and the expected `/api/vtu/airtime`/`/api/vtu/data` routes are not the implemented purchase route. |
| **C-014** | Airtime/Data request an admin-only settings endpoint. | Their pages call `getAdminSettings()`, which requests `/api/admin/settings`. Ordinary users are rejected by admin middleware, so network availability and pricing fall back incorrectly. |
| **C-015** | Cable purchase cannot satisfy its backend validator. | The page requests slug `tv` while the seeded service is `cable`, and sends provider/smart-card fields without the required `customerId`, `serviceId`, and `planId`. The alternate `/dashboard/services/tv` page is a static form with no submit handler. |
| **D-009** | Exam PIN purchase is only a mock. | The page has no state for board or quantity, no dynamic pricing, no wallet check, no PIN modal, no backend call, and no success/failure handling. |
| **D-010** | Service catalog UI contains duplicate/dead routes. | Cable is implemented under both `/cable` and `/tv`, both use the wrong `tv` slug, and the second route cannot submit a purchase. |
| **C-016** | Wallet live listener maps the API fields incorrectly. | Backend returns `main_balance`, `cashback_balance`, and `referral_balance`; [`useWalletListener.ts`](../web/frontend/src/hooks/useWalletListener.ts) reads camelCase names. Wallet polling therefore produces undefined/zero values instead of immediately reflecting credits or debits. |
| **D-011** | Failed VTU transactions are rolled back and disappear. | The purchase route marks the transaction failed and attempts a refund, then calls `ROLLBACK`. The failed transaction and debit ledger record are removed, while the response can still contain an ID for a transaction that no longer exists. |
| **D-012** | No local idempotency protection exists for purchases. | `requestId` is sent to the provider but is not used to find an existing local transaction and is not protected by a unique constraint. Retries can double-debit and duplicate purchases. |
| **D-014** | Cashback and referral rewards are disconnected. | `completeTransaction` never invokes the reward services. Those services call nonexistent `notificationService.sendNotification`. Referral logic also confuses a referral code with a UUID and can treat the initial referral row as already processed. |
| **E-002** | Admin proxy omits much of the admin API. | [`web/admin/server/routes.js`](../web/admin/server/routes.js) registers only a subset of admin routes. The client calls missing proxy paths for `/services`, `/plans`, `/admins`, support, announcements, finance, providers, wallet requests, and several user operations. Those features return 404 before reaching the backend. |
| **C-001** | Admin services endpoint returns plans. | `adminController.getServices` calls `getServicePlans()` and returns plan rows while the admin page expects service-category rows. IDs can be edited or deleted as the wrong entity. |
| **C-002** | Admin plan SQL and payload do not match the schema. | Controller writes nonexistent `active` instead of `is_active` and omits required `service_id`, `network_key`, and `type`. The form sends camelCase prices and keeps type only in metadata. Creation/update can fail or produce unusable plans. |
| **C-003** | Admin service creation sends `id` instead of required `slug`. | The admin form calls `createService({ name, id, icon, category })`; the backend requires `slug`, so creation is rejected. |
| **C-004** | Admin service edit can overwrite required fields with undefined/null. | The edit form omits `slug` and `description`, but the controller includes them in its update object. Since `slug` is not nullable, editing can fail. |
| **C-005** | Admin creation does not reliably promote the new admin. | `registerUser` returns `{ user, tokens }`, but `createAdmin` treats the whole object as the user and uses `user.id` instead of `user.user.id`. |
| **C-015A** | Admin user operations use mismatched request fields. | Client helpers send `uid`/`email`, while backend `promoteToAdmin` and `suspendUser` require `userId`. The backend can return `400 userId is required`; the client’s delete endpoint is not registered at all. |
| **D-015** | Admin statistics use an invalid status and duplicate route. | The first stats handler filters `status = 'completed'`, while the schema/purchase flow uses `success`, `failed`, `pending`, and `processing`. A later `/stats` handler uses `success` but is unreachable because the first handler responds. Sales metrics can show zero. |

## P2 security, privacy, and correctness defects

| ID | Finding | Evidence and effect |
|---|---|---|
| **A-010** | Provider failures are not auditable. | Rolling back failed transactions removes the evidence needed for support, reconciliation, and refund tracking. Use a committed failed state plus a separate refund entry instead. |
| **A-011** | Requery authorization has an operator-precedence flaw. | Query logic equivalent to `reference = $1 OR (requestId = $2 AND user_id = $3)` lets a matching reference bypass the user predicate. A user who knows another reference can retrieve it. |
| **D-013** | Transaction detail endpoint lacks ownership filtering. | `GET /api/transactions/:id` looks up only by ID and returns another user’s transaction to any authenticated caller. |
| **D-011A** | Support ticket messages lack ownership checks. | Authenticated users can read or reply to any ticket UUID because message/reply queries do not constrain the ticket to `req.user.id`. |
| **C-007** | Notification drawer is entirely client-local. | [`NotificationContext.tsx`](../web/frontend/src/contexts/NotificationContext.tsx) reads/writes local storage only; [`Notification.tsx`](../web/frontend/src/components/Notification.tsx) has no fetch, polling, websocket, or backend subscription. Server-side verification, wallet, and transaction notifications cannot appear automatically. Local notifications can also persist across accounts on one browser. |
| **D-011B** | Support ticket initial message is discarded. | The UI collects `message`, but the shared helper sends only `subject` and `category`; the backend stores no initial message with the ticket. |
| **C-009** | Auth/user property shapes are inconsistent. | Customer code alternates between `full_name`/`fullName`, `email_verified`/`emailVerified`, nested wallet fields, and top-level wallet fields. This can leave greeting, verification state, or balance blank/stale until another hydration path runs. |
| **D-005** | Verification redirect uses the wrong route/property. | Dashboard checks `emailVerified` even though backend responses use `email_verified`, then navigates to `/verify`; the repository has `/verify-email`, not `/verify`. |
| **D-012A** | Alternate transaction route does not fulfill purchases. | `POST /api/transactions/purchase` inserts a pending row but does not debit, call a provider, complete, or refund. It conflicts with `/api/vtu/purchase` and can leave callers permanently pending. |
| **D-013A** | Customer security and support pages contain compile-time contract errors. | Support calls the toast API with `variant` and omits required `type`; security uses the non-callable `pinLoading` state value. |
| **D-002** | Admin build pipeline ignores its type-check failure. | `npm run check` exits 2, but `npm run build` only runs Vite and exits 0. Broken admin code can be deployed. |
| **D-001** | Customer build pipeline ignores TypeScript errors. | `npx tsc --noEmit` exits 2, while [`next.config.js`](../web/frontend/next.config.js) sets `typescript.ignoreBuildErrors: true`. |

## Complete TypeScript diagnostics captured

### Customer frontend (`npx tsc --noEmit` exits 2)

| File | Confirmed diagnostic |
|---|---|
| `dashboard/security/page.tsx` | `pinLoading` is a Boolean and is called as a function. |
| `dashboard/services/airtime/page.tsx` | Purchase helper receives three arguments where one is expected. |
| `dashboard/services/data/page.tsx` | Uses nonexistent `ServicePlan.priceUser` instead of `price_user`; purchase helper receives three arguments. |
| `dashboard/services/electricity/page.tsx` | `useEffect` is not defined/imported. |
| `dashboard/support/page.tsx` | Toast calls use unsupported `variant` and omit required `type`. |
| `dashboard/wallet/page.tsx` | `UserProfile.referral` and `initiateFunding().error` do not exist in declared types. |
| `register/page.tsx` | `acceptTerms` is not part of `SignUpData`. |
| `TransactionPinModal.tsx` | `UserProfile.pinHash` does not exist. |
| `contexts/AuthContext.tsx` | Backend `User` and frontend `UserProfile` shapes are incompatible; wallet fields are missing; signup payload lacks required `full_name`; login return type is incompatible. |
| `hooks/useAuthForm.ts` | Auth context has no `verifyEmail`; `rememberMe` is not part of `LoginCredentials`. |
| `hooks/useWalletListener.ts` | Reads camelCase fields from a snake_case response type. |
| `lib/auth.ts` | Indexes `HeadersInit` incorrectly and constructs a `User` without required `role`. |

### Admin panel (`npm run check` exits 2)

| File | Confirmed diagnostic |
|---|---|
| `client/src/lib/backend.ts` | Imports nonexistent named `apiRequest`, uses untyped `import.meta.env`, and exports undefined `db`. |
| `client/src/pages/Finance.tsx` | Uses absent `totalWalletBalance`, `isService`, and `type` properties. |
| `client/src/pages/Login.tsx` | Uses untyped `import.meta.env`. |
| `client/src/pages/Profile.tsx` | `User` type lacks `phone`, and profile update rejects `phone`. |
| `client/src/pages/Services.tsx` | Settings helper type does not accept `airtimeNetworks`. |
| `client/src/pages/Transactions.tsx` | Missing module `@/lib/useEffectOnce`. |
| `client/src/pages/Wallet.tsx` | Declared wallet credit/debit responses do not contain `error`. |

## Dependency and documentation findings

| ID | Finding | Evidence |
|---|---|---|
| **E-001** | README describes a different stack and API. | README advertises Firebase, but implementation uses PostgreSQL and JWT. It documents endpoints such as `/api/wallet/fund` and `/api/services/verify` that are not in the current route set. It also claims all configuration uses current Render URLs while source defaults still contain legacy Ferixas hosts. |
| **E-003** | Backend dependency tree has unresolved high/critical advisories. | `npm audit --omit=dev --audit-level=high` reports 16 vulnerabilities, including critical `protobufjs` and `tar` advisories and high Axios advisories. |
| **E-003A** | Customer frontend dependency tree has unresolved high/critical advisories. | The audit reports six vulnerabilities, including critical Swiper and high Next.js, Sharp, PostCSS, Nanoid, and Picomatch advisories. |
| **E-003B** | Admin dependency tree has unresolved high advisories. | The audit reports nine vulnerabilities, including high Drizzle ORM, Lodash, WebSocket, and Express dependency advisories. |

Dependency audit output identifies package risks; it does not by itself prove every advisory is exploitable in every deployed path. Upgrade and regression-test dependencies rather than applying `npm audit fix --force` blindly.

## Validation performed

| Check | Result |
|---|---|
| Repository clone | Completed from the public GitHub repository at commit `0d779fd`. |
| Backend JavaScript syntax | Passed for all tracked backend JavaScript files checked with `node --check`. |
| Backend startup | Reached `Server running on port 3001` and initialized cron jobs during a short no-credentials startup test. Database/provider operations were not exercised. |
| Customer TypeScript | Failed with exit code 2; diagnostics preserved in `audit/checks/frontend_tsc.txt`. |
| Customer production build | Exited 0 because Next.js ignores TypeScript errors; this is not a correctness pass. |
| Admin TypeScript | Failed with exit code 2; diagnostics preserved in `audit/checks/admin_tsc.txt`. |
| Admin production build | Exited 0 because Vite build does not run the failing TypeScript check. |
| Live deployment connectivity | Inconclusive from this sandbox: documented URLs returned TLS/connection-closed errors (`curl` status 000 and browser `ERR_CONNECTION_CLOSED`). This is not proof that Render is down. No live credentials, database, Flutterwave account, or VTU provider account were available for transaction tests. |

## Recommended remediation order

### 1. Stabilize security and account lifecycle

Implement a real email provider and verification-token lifecycle. Generate a single-use, expiring verification token at registration, persist it, send a link containing the current frontend callback URL, consume it transactionally, and return the actual database verification state. Add a real resend endpoint with rate limiting. Do the same for password-reset delivery and never return reset tokens in normal API responses. Normalize one user DTO so every client receives one naming convention.

Move transaction-PIN verification to the backend. Store it with bcrypt or Argon2, verify it in the authenticated purchase request, rate-limit failures, and never return the hash. Implement the PIN-change endpoint before displaying a success message. Fix logout so local tokens/state are cleared immediately, the backend revocation request is best-effort with a timeout, and the client always navigates to `/login`.

### 2. Repair wallet and payment atomicity

Use one database client for each payment/wallet operation. Lock the wallet row with `SELECT ... FOR UPDATE`, use SQL arithmetic or a single atomic update, enforce nonnegative balances, and make wallet ledger plus transaction status part of one transaction. Add idempotency keys with a unique constraint. Use exactly one local payment row and exactly one provider reference from checkout through webhook, callback, and reconciliation. Lock pending payments before crediting and make webhook processing idempotent.

### 3. Establish one service contract

Choose one purchase endpoint and one payload contract, preferably `/api/vtu/purchase` with `{ type, amount, details }`. Make the frontend helpers, service pages, backend validator, provider adapter, and database plan rows use the same names and IDs. Add the missing `/api/services/:slug` route or stop calling it. Normalize `is_active` to `enabled` at the API boundary. Implement provider-specific verification/variation lookup before allowing electricity, cable, and exam purchases.

### 4. Repair admin routing and schema contracts

Create an endpoint matrix from admin client calls to proxy routes and backend routes. Add or remove every missing route deliberately. Correct service/plan SQL and use schema names (`is_active`, `service_id`, `network_key`, `type`). Make admin user payloads consistent (`userId` versus `uid`) and enforce admin authorization only on the backend. Add an actual type-check step to the admin production build.

### 5. Fix authorization and observability

Constrain every ticket, message, transaction, requery, and payment query by the authenticated user unless the caller is an authorized admin. Keep failed transactions and refunds as committed records. Add server-backed notification endpoints plus frontend polling or websocket delivery, and clear account-scoped local state when users change.

### 6. Make builds and dependencies truthful

Remove `typescript.ignoreBuildErrors`, run `tsc --noEmit` in CI and before production builds, repair the reported type errors, and upgrade vulnerable dependencies through planned compatibility changes. Update the README, environment templates, route documentation, and deployment commands to match the PostgreSQL/JWT/Render implementation.

## Audit limitations

This report is a source and build audit, not a live payment certification. It could not safely execute real wallet deposits, provider purchases, webhooks, email delivery, or database mutations without valid deployment credentials and a test environment. The live URLs were unreachable from the audit sandbox. The reported code defects are nevertheless reproducible from the committed repository and should be fixed before live end-to-end testing.

## References

1. [AsaforVTU GitHub repository](https://github.com/Asaphis/AsaforVTU)
2. [Next.js TypeScript build configuration](../web/frontend/next.config.js)
3. [Backend dependency audit output](./checks/backend_npm_audit.txt)
4. [Customer TypeScript diagnostics](./checks/frontend_tsc.txt)
5. [Admin TypeScript diagnostics](./checks/admin_tsc.txt)
6. [Live connectivity check output](./checks/live_http_checks.txt)
