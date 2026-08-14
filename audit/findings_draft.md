# Audit findings draft

## Confirmed defects

No confirmed defects have been retained from the initial import check. The first formatted source view omitted each file's first line; raw-source verification confirmed that the repository does import `Pool`, `express`, `app`, `bcrypt`, `jwt`, and `express.Router` where expected. The apparent bootstrap defects were false positives and have been removed.

## Evidence excerpts and verification notes

The repository was cloned from `https://github.com/Asaphis/AsaforVTU.git` at commit `0d779fd` on the `main` branch. The audit is limited to tracked source, configuration, and documentation files; binary assets are not treated as executable logic. Each apparent line-one import issue was checked with raw source before being considered.

## Confirmed backend and integration findings

### A-001 — Registration leaves the database unverified while returning an auto-verified user
`backend/src/services/authService.js` comments out insertion into `email_verification_tokens`, does not set `users.email_verified`, commits the user with the schema default `FALSE`, and returns `email_verified: true`. The verification endpoint still requires a token row that registration never creates. This creates a split-brain account state: the signup response says verified, the database says unverified, and the emailed-link flow has no token to consume.

### A-002 — No email or push delivery implementation exists for verification or password reset
The notification service only inserts and reads database notifications. Registration does not send mail, verification has no token producer, and password reset returns `reset_token` directly in the API response instead of delivering a reset link. The frontend therefore promises inbox notifications that the backend does not implement.

### A-003 — Admin authentication can fail for database admins whose role is not `admin`
`authenticateAdmin` checks `req.user.is_admin`, but `authenticate` populates `req.user` with only `id`, `email`, and `role`. The `is_admin` value selected from the database is discarded, so an account relying on the `users.is_admin` flag can be denied unless its role or email also matches.

### A-004 — Wallet credit/debit updates are vulnerable to lost updates and are not truly atomic
`walletService.creditWallet` and `debitWallet` begin a transaction on one client but call `getWalletByUserId` and `createWallet`, which use separate pool connections. They read a balance without `FOR UPDATE`, compute a new value in JavaScript, and then write it. Concurrent deposits or purchases can overwrite each other, and the outer transaction does not contain the nested operations.

### A-005 — Successful and failed payment processing uses a transaction client different from the service queries
`paymentService.processSuccessfulPayment`, `processFailedPayment`, and `reversePayment` open a transaction on `client`, but `getPaymentById`, `updatePaymentStatus`, wallet operations, and transaction operations use the pool independently. A later failure can therefore leave earlier status or balance changes committed, despite the caller rolling back its own unrelated transaction. The success path also checks status before crediting without a row lock, so concurrent webhook/verify requests can credit twice.

### A-006 — Flutterwave creates duplicate local payment rows and mismatched references
`paymentRoutes /initiate` first creates a local payment with an auto-generated `PAY_...` `tx_ref`, then `flutterwaveService.initiatePayment` creates a second row with a separate `DEP-...` `tx_ref`. The route returns the first reference while the provider checkout uses the second. Verification looks up the returned first reference, then asks Flutterwave to verify that reference, so the provider lookup and local payment record can disagree and wallet crediting can fail or target the wrong row.

### A-007 — Payment redirect defaults point to a legacy domain
Both payment route and Flutterwave service default to `https://vtu.ferixas.com/payment-complete`, while the repository’s current Render frontend is `https://asaforvtu.onrender.com`. Unless `FLW_REDIRECT_URL` is explicitly set in the backend environment, successful checkout returns the user to the legacy host rather than the deployed application.

### A-008 — VTU service resolution searches the wrong field
The purchase route calls `getServicePlans()` and searches `s.category`, but the service query returns plan rows with `service_category`, `service_slug`, and no `category`. `serviceId` therefore remains null for normal purchases, weakening transaction linkage and potentially producing invalid records.

### A-009 — Data, electricity, and cable provider calls have incorrect method signatures
The route passes `providerCost` as the third argument to `purchaseData`, although the provider adapter expects `planId`; it passes `providerCost` as the third argument to `purchaseElectricity`, although the adapter expects `serviceId`; and it calls `providerService.purchaseCable`, but the adapter exports `purchaseCableTV`. These paths cannot reliably reach the provider with the intended payload, and cable throws a missing-method error.

### A-010 — Provider-failure transactions are rolled back and disappear
On a failed VTU provider response, the route updates the transaction to `failed`, attempts a refund, and then calls `ROLLBACK`. The failed transaction record and the initial debit ledger entry are both removed, while the response returns an ID for a transaction that no longer exists. This prevents support/audit visibility of failed purchases.

### A-011 — VTU purchases have no database idempotency protection
The route forwards `details.requestId` to the provider but does not use it to find an existing local transaction or enforce a unique constraint. Retrying a request can debit the wallet and create another transaction again.

### A-012 — Requery can disclose another user’s transaction
The requery SQL is `reference = $1 OR metadata->>'requestId' = $2 AND user_id = $3`. Because `AND` binds more tightly than `OR`, a matching reference bypasses the `user_id` predicate. Any authenticated user who knows another user’s reference can retrieve that transaction.

## Confirmed admin and catalog findings

### C-001 — Admin “services” endpoint returns service plans instead of services
`adminController.getServices` calls `getServicePlans()` and returns plan rows. The admin page treats the response as service-category rows, while the public frontend correctly reads the `services` table. As a result, the admin category screen can display the wrong objects and edits/deletions can target plan IDs as if they were service IDs.

### C-002 — Admin plan creation and update SQL does not match the schema
The controller writes an `active` column that does not exist; the schema column is `is_active`. Creation also omits required `service_id`, `network_key`, and `type` columns. The admin plan form sends camelCase `priceUser`/`priceApi` and stores the plan type only inside metadata, whereas the controller reads snake_case fields and never reads the metadata type into the required `type` column. Plan creation therefore fails at the database layer or produces no usable plan.

### C-003 — Admin service creation sends `id` while the backend requires `slug`
`NewServiceForm` calls `createService({ name, id, icon, category })`. The backend requires `slug`, so the request is rejected as missing a required field. The UI then cannot create a service category.

### C-004 — Admin service editing omits required values and overwrites them with null/undefined
`EditServiceForm` sends only `name`, `icon`, and `category`. The controller builds an update for `slug` and `description` from absent values; `slug` is `NOT NULL`, so the update can fail, and the existing slug is not preserved.

### C-005 — Admin creation of an administrator updates the wrong object
`registerUser` returns `{ user, tokens }`, but `createAdmin` stores that whole result in `user` and then uses `user.id` in the SQL update. The actual ID is `user.user.id`, so the promotion query receives an undefined ID and the new account is not reliably marked admin.

### C-006 — “Generate verification link” invokes password-reset logic
The admin controller’s verification-link handler calls `requestPasswordReset`. It therefore generates a password-reset token rather than an email-verification token, exposing the wrong workflow and potentially handing an admin a credential-reset token under a verification label.

### C-007 — Customer notification drawer is not connected to server notifications
The frontend notification context only reads/writes `localStorage` under `notifications_log`. It never calls the backend notification endpoints, so server-side transaction, wallet, or announcement notifications cannot appear in the bell. Browser-local notifications also persist across accounts on the same browser unless explicitly cleared.

### C-008 — Logout navigation goes to the public home page, not the login page
Both dashboard logout handlers call `signOut()` and then `router.push('/')`. This is inconsistent with a post-logout login redirect and can leave the user on a page that does not immediately expose the login form. The auth context does clear state, but the reported expectation of an immediate login-page redirect is not implemented.

### C-009 — Dashboard reads user fields that the auth data does not guarantee
The dashboard header uses `user.fullName` and `user.walletBalance`, while the raw auth client’s `User` response uses `full_name` and nested `wallet`. The context mutates the object with camelCase fields only during some load/login paths, and logout/login/signup paths do not consistently hydrate the same shape. This can leave the greeting and balance blank or stale until a reload.

### C-010 — Customer authentication is coupled to a legacy hard-coded backend URL
`web/frontend/src/lib/auth.ts`, `services.ts`, and `AuthContext.tsx` default to `https://vtuapi.ferixas.com`. The Render configuration sets `VITE_VTU_BACKEND_URL`, not `NEXT_PUBLIC_API_URL`, and documents `https://asaforvtubackend.onrender.com` as the backend. Unless an untracked environment variable overrides the default, customer auth, wallet, payments, and service requests target the legacy host.

### C-011 — Registration navigates to a verification-sent page even though no verification email is produced
The registration page unconditionally pushes `/verify-email-sent` after signup. That page promises an inbox link, but registration neither creates a verification token nor sends email. Users are directed into a dead-end flow.

### C-012 — Resend verification calls `verifyEmail()` without a token and without a context method
`useAuthForm` destructures `verifyEmail` from `useAuth`, but `AuthContextType` and the provider value do not expose it. The call also supplies no token to a function that requires one. This is both a TypeScript contract error and a nonfunctional resend flow.

### C-013 — Data and Airtime pages call purchase helpers with the wrong signature and endpoint
The shared helpers accept one payload object and post to `/api/vtu/data` or `/api/vtu/airtime`, but the page callers pass `(user.uid, amount, details)`. JavaScript ignores the extra arguments, so the helper sends the user ID string as the body and targets backend routes that are not defined; the existing backend route is `/api/vtu/purchase` with a `{ type, amount, details }` body.

### C-014 — Customer pages use an admin-only settings endpoint for public service availability
The customer Airtime and Data pages call `getAdminSettings()`, which requests `/api/admin/settings`. That endpoint is protected by admin authentication, so normal users receive a forbidden response and the pages fall back to empty/default settings, making networks unavailable or incorrectly displayed.

### C-015 — Cable page uses the wrong service slug and omits required purchase fields
The cable page requests service slug `tv` even though the seeded service slug is `cable`. Its purchase body lacks `customerId`, `serviceId`, and `planId`, all required by the backend validator, and it calls the generic helper with a different argument shape. Cable checkout therefore cannot satisfy the backend contract.

### C-016 — Wallet live listener maps snake_case API fields from camelCase names
The backend returns `main_balance`, `cashback_balance`, and `referral_balance`; `useWalletListener` reads `mainBalance`, `cashbackBalance`, and `referralBalance`. The polling loop therefore writes zeros/undefined and does not update the displayed balance after a deposit or purchase.

## Confirmed client, security, and build findings

### D-001 — Customer frontend TypeScript check fails in multiple files
`npx tsc --noEmit` exits with code 2. Confirmed errors include wrong purchase-helper arity in Airtime/Data, missing `useEffect` in Electricity, invalid support toast fields, missing wallet/user properties, incompatible auth user types, absent `verifyEmail` context member, invalid `rememberMe` field, and snake_case/camelCase wallet mapping errors. The production build still exits 0 only because `next.config.js` sets `typescript.ignoreBuildErrors: true`, allowing these defects to ship.

### D-002 — Admin TypeScript check fails and is not part of the production build
`npm run check` exits with code 2. It reports a nonexistent `apiRequest` export, missing `ImportMeta.env` typing, an undefined `db`, analytics field mismatches, profile field mismatches, settings payload mismatch, a missing `useEffectOnce` module, and wallet response-shape errors. `npm run build` uses Vite and exits 0 without type-checking, so the broken type contract is deployable.

### D-003 — Customer transaction PIN validation is impossible and insecure
The backend hashes the registration PIN with bcrypt and does not return `pin_hash`/`pinHash` to the client. The frontend modal computes a client-side SHA-256 hash and compares it to `user.pinHash`, a property absent from the normal auth user shape. The PIN is therefore not validated against the backend, and normal purchases will fail the comparison or can be bypassed if client state is manipulated. PIN verification must be a server-side authenticated check.

### D-004 — PIN change is a false success and contains a direct runtime error
The security page has no backend PIN-change endpoint, calls `pinLoading(true)` instead of `setPinLoading(true)`, and shows “PIN changed successfully” without persisting anything. The TypeScript compiler independently flags the call as a non-callable Boolean.

### D-005 — Customer dashboard verification redirect targets a nonexistent route and checks the wrong property
The dashboard checks `user.emailVerified`, while raw backend/auth responses use `email_verified`; when it evaluates false/undefined it pushes to `/verify`, but the repository provides `/verify-email`, not `/verify`. A user with an otherwise valid session can be sent to a 404 route.

### D-006 — Customer service lookup endpoint is missing from the backend
`getServiceBySlug()` requests `GET /api/services/:slug`, but `backend/src/app.js` only defines `GET /api/services` and does not mount a slug-specific handler. Every `useService('airtime'|'data'|'cable'|'electricity'|'exam-pins')` lookup can therefore return 404, preventing service pages from loading.

### D-007 — Backend service records expose `is_active`, while customer pages gate on `enabled`
The public services endpoint returns database rows with `is_active`. Airtime, Data, Cable, and Exam PIN pages use `service.enabled` in button disable/label logic. Since `enabled` is undefined, their purchase buttons can render disabled or “coming soon” even when the service is active.

### D-008 — Electricity page cannot render cleanly because `useEffect` is not imported
The page imports only `useState` but invokes `useEffect`, producing a confirmed TypeScript error and a runtime `ReferenceError` if the page is executed without a bundler transform that masks it.

### D-009 — Exam PIN page is only a static mock
The page has no selected-board or quantity state, no price calculation, no transaction PIN confirmation, no wallet check, no API call, and no transaction result handling. The purchase button is presentation-only.

### D-010 — Cable/TV pages are duplicate dead-end implementations
The main Cable page uses slug `tv` even though the seeded service is `cable`, while the alternate `/dashboard/services/tv` page also uses `tv` and has no submit handler or provider call. Both pages can show an unavailable service or a nonfunctional subscribe button.

### D-011 — Support tickets lose the user’s initial message and expose other users’ tickets
The customer helper sends `{ subject, category }` while the UI collects a message that is never included. The backend ticket table has no message column, so the initial description is discarded unless the user sends a later reply. In addition, `GET /tickets/:id/messages` and `POST /tickets/:id/reply` check only authentication, not ticket ownership, allowing any authenticated user who knows a ticket UUID to read or write it.

### D-012 — Alternate transaction purchase route creates pending rows but does not debit or fulfill purchases
`POST /api/transactions/purchase` validates and inserts a pending transaction only. It does not call the provider, debit the wallet, or complete/refund the transaction. It conflicts with the actual `/api/vtu/purchase` implementation and can leave callers with permanently pending records.

### D-013 — Transaction detail endpoint lacks ownership filtering
`GET /api/transactions/:id` returns any transaction found by ID to any authenticated caller and includes joined user/service information. It should constrain the query by `user_id = req.user.id` unless the caller is an admin.

### D-014 — Server-side cashback/referral reward flows are disconnected or broken
`completeTransaction` contains only a comment that cashback would be handled separately and never invokes `cashbackService` or `referralService`. The reward services call `notificationService.sendNotification`, which is not exported. Referral registration stores a referral code in `users.referred_by` while reward logic treats that value as a UUID, and the initial referral row makes the later “already processed” check prevent the reward. Cashback/referral credits and their notifications therefore do not work reliably.

### D-015 — Admin statistics use the wrong transaction status in the first route
`adminController.getStats` calculates today’s sales and daily totals using `status = 'completed'`, but the schema and purchase flows use `success`, `failed`, `pending`, and `processing`. A second `/stats` route later uses `success`, but the first handler responds and prevents the second from running. Admin sales metrics can therefore report zero.

## Confirmed documentation and dependency findings

### E-001 — Repository documentation describes a different architecture and API contract
The root README still advertises Firebase for the backend/database/auth stack, while the implementation uses Neon PostgreSQL and JWT. It documents `/api/wallet/fund` and `/api/services/verify`, neither of which is implemented in the current route set, and describes all URLs as Render subdomains while several source defaults still use `vtuapi.ferixas.com` and `vtu.ferixas.com`. This makes deployment and troubleshooting instructions unreliable.

### E-002 — Admin proxy omits many endpoints used by the admin client
The admin client calls `/api/admin/services`, `/api/admin/plans`, `/api/admin/admins`, `/api/admin/support/*`, `/api/admin/announcements`, `/api/admin/finance/*`, `/api/admin/providers`, `/api/admin/wallet/requests`, and several user operations. The admin proxy registers only a subset of `/api/admin` routes, and some of the omitted paths are also absent from the backend router. Those panel features return 404 or cannot reach the backend even when the controller exists.

### E-003 — Runtime dependency audits report unresolved high/critical vulnerabilities
The committed backend dependency tree reports 16 vulnerabilities, including critical `protobufjs` and `tar` advisories and high-severity Axios advisories. The customer frontend reports six vulnerabilities, including critical Swiper and high-severity Next.js/Sharp/PostCSS issues. The admin tree reports nine vulnerabilities, including high-severity Drizzle ORM, Lodash, WebSocket, and Express dependency issues. These are package risks from the lockfiles, not proof that each advisory is exploitable in every path, but they require remediation and regression testing.

## Verification results

Backend `node --check` passed for every tracked backend JavaScript file. A brief backend startup test reached `Server running on port 3001` and initialized cron jobs, so the earlier apparent missing-import concerns were false positives caused by a formatted file view that omitted first lines. The customer Next.js build and admin Vite build both exited 0, but the customer build ignores TypeScript errors through `ignoreBuildErrors: true`, and the admin build does not run its failing `tsc` check.

### E-004 — Documented live services could not be reached from the audit environment
Read-only requests to the README’s frontend, admin, backend health, and backend services URLs all failed with TLS/connection-closed errors (`curl` status 000; browser `ERR_CONNECTION_CLOSED`). This is evidence that connectivity was unavailable from this sandbox at audit time, not proof that Render is down; live service behavior could not be validated without a reachable deployment or user-provided logs/credentials.
