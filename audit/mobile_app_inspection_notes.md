# Mobile app inspection notes

The repository contains a Flutter WebView wrapper at `mobile/webview_app`.

## Current architecture

- Flutter project with `webview_flutter`, `url_launcher`, `app_links`, `connectivity_plus`, Firebase Messaging, and local notifications.
- Android package/application ID: `com.ferixas.asaforvtu`.
- Current app version in `pubspec.yaml`: `1.1.2+2004`.
- The live customer sign-in page at `https://vtu.ferixas.com/login` loaded successfully in the browser and presents the AsaforVTU sign-in flow.
- Current Flutter SDK was not installed initially; Flutter 3.47.0 with Dart 3.13.0 and Android SDK API 36 have now been installed locally for verification.

## Baseline status

- `flutter pub get` succeeds.
- `flutter analyze` succeeds with no issues.
- The Android release Gradle file currently hard-fails when `android/key.properties` is absent, although that file is ignored and not present in a clean checkout. This blocks the documented `flutter build apk --release` command.
- The current WebView source has no visible loading progress overlay despite the README promising loading indicators.
- Deep-link initialization and connectivity initialization are asynchronous without top-level error guards; a platform/plugin error could become an unhandled future.
- The retry action clears the offline state before verifying connectivity, which can expose a blank WebView when the device remains offline.
- Production customer host is `vtu.ferixas.com`; push registration API is `https://vtuapi.ferixas.com`. These hosts were confirmed in the current source and the customer host responded successfully.
- Android manifest deep-link host and iOS associated-domain entitlement currently use `vtu.ferixas.com`.

## Planned implementation

1. Harden WebView loading, progress/error feedback, deep links, and connectivity retry behavior.
2. Make release packaging work from a clean checkout with an explicit documented fallback while preserving real release signing when `android/key.properties` is supplied.
3. Re-run formatting, analysis, tests, and release APK builds, then inspect APK metadata and size.
