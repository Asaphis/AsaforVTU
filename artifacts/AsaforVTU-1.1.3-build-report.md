# AsaforVTU Optimized Android Build Report

## Delivery summary

You were correct that the previous 69.5 MB universal APK was not the right optimized deliverable. It bundled multiple CPU architectures in one file. The application has now been rebuilt as **ABI-specific release APKs**, with R8 code shrinking, resource shrinking, icon tree-shaking, and unused runtime assets removed.

The optimized source changes were pushed to GitHub in commit [`6147bbf`](https://github.com/Asaphis/AsaforVTU/commit/6147bbf). The application still opens the live customer experience at [`https://vtu.ferixas.com/login`](https://vtu.ferixas.com/login), supports in-app navigation and supported deep links, reports loading progress, and shows a verified retry state for connection or service failures.

## Optimization work completed

The Android release build now enables `isMinifyEnabled = true` and `isShrinkResources = true`, using the optimized Android ProGuard configuration. The build helper now uses `--split-per-abi --tree-shake-icons`, so each phone receives only the native Flutter engine and compiled application library required by its CPU architecture.

The unused `cupertino_icons` runtime dependency was removed. The unused `logo.png` and `app_icon.png` files were excluded from Flutter’s runtime asset bundle; the app’s runtime splash image remains available, and `app_icon.png` remains available as the launcher-icon generation source. The release manifest is non-debuggable, and the resulting packages contain no `kernel_blob.bin` or detected debug-symbol/mapping entries.

## Final APK options

| Device type | File | Exact size | Version code | SHA-256 |
|---|---|---:|---:|---|
| Most modern Android phones | `AsaforVTU-1.1.3-arm64-v8a-optimized.apk` | 32,140,189 bytes | 4005 | `76d4ab00a287582b6e2443b90bb5e808e844d50cd689adc2de5c354977cf8495` |
| Older 32-bit ARM phones | `AsaforVTU-1.1.3-armeabi-v7a-optimized.apk` | 29,434,119 bytes | 3005 | `68dd247cee8ebe948b957372f214c30dcde1775c73bbde8e399357a3cbfafdc5` |
| Android x86_64 emulator | `AsaforVTU-1.1.3-x86_64-optimized.apk` | 33,574,758 bytes | 6005 | `17bad9a2cc9a7c73bd715a4bde06e4276072ed39a1141cc96913a3ce078c086c` |

The recommended download for a normal current Android phone is **`AsaforVTU-1.1.3-arm64-v8a-optimized.apk`**. Do not install all three APKs on the same phone; choose only the package matching the device architecture.

For comparison, the previous universal APK was 69,547,579 bytes. The recommended arm64 package is 32,140,189 bytes, approximately **53.8% smaller** than that universal file while retaining the same application functionality for arm64 devices.

## Verification results

| Check | Result |
|---|---|
| Flutter SDK | Flutter 3.47.0, Dart 3.13.0 |
| Android SDK | API 36, Build Tools 36.0.0 |
| `flutter test` | Passed: 1 test |
| `flutter analyze` | Passed: no issues found |
| Optimized release build | Passed: `assembleRelease` with split-per-ABI output |
| APK signature | Verified with APK Signature Scheme v2 and v3 for every ABI package |
| Package name | `com.ferixas.asaforvtu` |
| Version | `1.1.3` |
| Android target | SDK 36; minimum SDK 24 |
| Debuggable manifest flag | Not present; release build is non-debuggable |
| Flutter kernel blob | Not present in any optimized APK |
| Debug-symbol/mapping entries | None detected inside any optimized APK |

## Installation

For most phones, download the attached **arm64-v8a** APK, open it from the Downloads notification or file manager, allow installation from that source if Android requests it, and tap **Install**. The phone must have internet access because the application loads the live customer platform in its WebView.

The APK is signed with the project’s local sideloading release key so it can be installed directly. It is not a Google Play production signing key. For future updates over this installation, retain the same keystore or configure the organization’s permanent private release keystore before publishing.

## References

[1]: https://github.com/Asaphis/AsaforVTU "AsaforVTU GitHub repository"
[2]: https://vtu.ferixas.com/login "AsaforVTU customer sign-in page"
[3]: https://docs.flutter.dev/deployment/android "Flutter Android deployment documentation"
