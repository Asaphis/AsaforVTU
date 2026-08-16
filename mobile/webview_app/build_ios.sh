#!/bin/bash
echo "Building iOS IPA..."
flutter clean
flutter pub get
dart run flutter_launcher_icons
dart run flutter_native_splash:create
cd ios
pod install
cd ..
flutter build ipa --release
echo "Build complete. IPA is located in build/ios/ipa"
