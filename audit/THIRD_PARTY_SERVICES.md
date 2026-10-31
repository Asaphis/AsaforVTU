# Third-Party Service Inventory

This is the current repository-level inventory for the interface and its public disclosures. It is not a claim that every provider contract has been reviewed.

| Service or integration | Evidence in project | Customer-facing purpose | Required owner verification |
|---|---|---|---|
| Flutterwave or configured payment provider | Wallet funding flow and provider verification calls | Wallet funding and payment status | Confirm merchant account, settlement, webhooks, fees, dispute handling, and privacy terms |
| VTU/service providers | Airtime, data, cable, electricity and exam purchase API paths | Deliver purchased service value | Confirm provider contracts, supported territories, delivery/reversal behavior, and data sharing |
| Email delivery provider | Registration, verification, password-reset and support flows | Operational account and support messages | Confirm sender identity, retention, unsubscribe behavior for optional marketing, and delivery logs |
| Hosting and deployment provider | Next.js application and public origin | Serve the website and APIs | Confirm region, logs, backups, access controls, and incident response |
| Google Fonts | CSS import for Inter | Typography | Confirm license and whether self-hosting is required for the intended privacy posture |
| Google Search Console | Deployment/SEO workflow | Indexing and search diagnostics | Verify the production domain, submit the sitemap, and review indexing reports after deployment |
| WhatsApp support link | Manual wallet funding support action | Customer support and proof-of-payment contact | Confirm the destination number is owned by the operator and that customers are warned not to send secrets |

Before launch, the owner should replace any generic provider description with the exact legal provider name, privacy-policy URL, and data-processing role for each active integration.
