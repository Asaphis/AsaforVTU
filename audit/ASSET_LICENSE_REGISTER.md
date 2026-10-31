# Asset and Font License Register

This register is part of the interface audit. It records what the repository can verify today and identifies items that require owner/provider confirmation before commercial launch.

| Asset category | Current source | Repository evidence | Production action |
|---|---|---|---|
| AsaforVTU/Ferixas logo | `web/frontend/public/` and imported logo assets | Treated as owner-supplied brand artwork | Confirm the owner has permission to use and publish each supplied logo variant |
| UI icons | `lucide-react` | Declared in `web/frontend/package.json` | Retain the package license notice in the distribution process |
| Web font | Google Fonts import in `src/app/globals.css` | Inter is loaded from Google Fonts | Confirm the selected font and weight usage remains covered by its license |
| PWA icons | `web/frontend/public/pwa-icon-192.png`, `pwa-icon-512.png` | Repository assets | Confirm these are owner-supplied or licensed for commercial use |
| Promotional banners | `RealBannerCarousel.tsx` sources | Existing project artwork | Confirm each banner is owner-supplied or has a written license; do not publish unverified stock images |
| Provider marks | Provider components and text labels | Provider names may be third-party trademarks | Use only where necessary to identify supported services; do not imply endorsement |

No asset is marked “licensed” merely because it exists in the repository. The owner should attach invoices, permissions, or license URLs for any externally sourced image, font, logo, or provider artwork before final deployment.
