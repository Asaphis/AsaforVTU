# 🎨 Asset Management & Branding Guidelines

## Asafor VTU Brand Asset Updates

**Status**: Ready for Asset Implementation
**Last Updated**: January 21, 2026

---

## Brand Specifications

### Brand Name
- **Legal**: Asafor VTU
- **Display**: Asafor VTU
- **Short**: Asafor

### Brand Symbol
- **Name**: AsaPhis Abstract Tech Symbol
- **Style**: Modern, minimal, professional
- **Context**: Global technology organization with African roots
- **Color Palette**:
  - Primary Blue: `#0B4F6C`
  - Gold Accent: `#C58A17`
  - Green Secondary: `#4CAF50`

---

## Asset Locations & Update Instructions

### 1. 🌐 Web Frontend Assets

#### Logo Files
```
Location: web/frontend/public/
Current: logo.png
Action: Replace with AsaPhis symbol
Sizes: Keep flexible sizing for responsive design
```

#### Favicon
```
Location: web/frontend/public/favicon.ico
Current: favicon.ico
Action: Replace with AsaPhis symbol
Format: ICO (multi-size: 16x16, 32x32, 64x64)
Backup: Create favicon.png as well
```

#### Images in Components
```
Locations:
- web/frontend/public/assets/images/hero-placeholder.png
- web/frontend/src/components/ (alt references)
Action: Update hero image with brand-appropriate imagery
Use: Brand colors in design
```

#### OpenGraph Image
```
Location: web/frontend/public/ or web/frontend/src/
File: og-image.png (for social sharing)
Size: 1200x630 pixels recommended
Content: Logo with brand colors
```

---

### 2. 📱 Mobile App Assets

#### Splash Screens

**Android Splash Screens:**
```
Locations:
- mobile/webview_app/android/app/src/main/res/drawable-hdpi/splash.png
- mobile/webview_app/android/app/src/main/res/drawable-mdpi/splash.png
- mobile/webview_app/android/app/src/main/res/drawable-xhdpi/splash.png
- mobile/webview_app/android/app/src/main/res/drawable-xxhdpi/splash.png
- mobile/webview_app/android/app/src/main/res/drawable-xxxhdpi/splash.png

Dark Mode:
- mobile/webview_app/android/app/src/main/res/drawable-night-hdpi/android12splash.png
- mobile/webview_app/android/app/src/main/res/drawable-night-mdpi/android12splash.png
- mobile/webview_app/android/app/src/main/res/drawable-night-xhdpi/android12splash.png
- mobile/webview_app/android/app/src/main/res/drawable-night-xxhdpi/android12splash.png
- mobile/webview_app/android/app/src/main/res/drawable-night-xxxhdpi/android12splash.png

Action: Replace with AsaPhis symbol and brand colors
Sizes: Maintain specified DPI versions
```

**iOS Splash Screens:**
```
Locations:
- mobile/webview_app/ios/Runner/Assets.xcassets/LaunchImage.imageset/
  - LaunchImage.png
  - LaunchImage@2x.png
  - LaunchImage@3x.png
  
- mobile/webview_app/web/splash/img/
  - light-1x.png, light-2x.png, light-3x.png, light-4x.png
  - dark-1x.png, dark-2x.png, dark-3x.png, dark-4x.png

Action: Replace with AsaPhis symbol
Maintain: All resolution variants
```

#### App Icons

**Android App Icons:**
```
Locations:
- mobile/webview_app/android/app/src/main/res/mipmap-hdpi/ic_launcher.png
- mobile/webview_app/android/app/src/main/res/mipmap-mdpi/ic_launcher.png
- mobile/webview_app/android/app/src/main/res/mipmap-xhdpi/ic_launcher.png
- mobile/webview_app/android/app/src/main/res/mipmap-xxhdpi/ic_launcher.png
- mobile/webview_app/android/app/src/main/res/mipmap-xxxhdpi/ic_launcher.png

Sizes Required:
- mdpi: 48x48
- hdpi: 72x72
- xhdpi: 96x96
- xxhdpi: 144x144
- xxxhdpi: 192x192

Also update:
- mobile/webview_app/android/app/src/main/res/mipmap-*/launcher_icon.png

Action: Replace with AsaPhis symbol
Colors: Use #0B4F6C as primary, #C58A17 for accents
```

**iOS App Icons:**
```
Locations:
- mobile/webview_app/ios/Runner/Assets.xcassets/AppIcon.appiconset/

Files to update:
- Icon-App-*@*.png (all variants)

Sizes Required:
- 20x20 (1x, 2x, 3x)
- 29x29 (1x, 2x, 3x)
- 40x40 (1x, 2x, 3x)
- 50x50 (1x, 2x)
- 57x57 (1x, 2x)
- 60x60 (2x, 3x)
- 72x72 (1x, 2x)
- 76x76 (1x, 2x)
- 83.5x83.5 (2x)
- 1024x1024 (1x) - AppStore

Also update:
- mobile/webview_app/macos/Runner/Assets.xcassets/AppIcon.appiconset/
  - app_icon_16.png
  - app_icon_32.png
  - app_icon_64.png
  - app_icon_128.png
  - app_icon_256.png
  - app_icon_512.png
  - app_icon_1024.png

Action: Replace with AsaPhis symbol
Colors: Use #0B4F6C as primary
```

#### Web Icons
```
Location: mobile/webview_app/web/icons/
Files:
- Icon-192.png
- Icon-512.png
- Icon-maskable-192.png
- Icon-maskable-512.png
- favicon.png

Action: Replace with AsaPhis symbol
Colors: Use brand palette
```

#### Miscellaneous
```
Location: mobile/webview_app/assets/logo.png
Action: Replace with AsaPhis symbol
Use: As fallback/error display
```

---

### 3. 👨‍💼 Admin Panel Assets

#### Admin Logo
```
Location: web/admin/client/public/
Current: favicon.jpg, opengraph.jpg, and other assets
Action: Update with Asafor branding
Ensure: Professional appearance for admin users
```

#### Admin Favicons
```
Location: web/admin/client/public/
Files: favicon.jpg
Action: Replace with professional admin icon
Use: Brand colors
```

---

### 4. 📦 Manifest Files

#### Web App Manifest
```
Location: mobile/webview_app/web/manifest.json
Fields to Review:
- "name": Should reference Asafor VTU
- "short_name": Asafor
- "description": Update to Asafor VTU description
- "icons": Verify correct paths

Current Content: Already updated in branding process
```

#### iOS Configuration
```
Location: mobile/webview_app/ios/Runner/Info.plist
Fields:
- CFBundleDisplayName: Should be "Asafor VTU"
- CFBundleIdentifier: Check if needs updating

Action: Verify during asset update
```

#### Android Configuration
```
Location: mobile/webview_app/android/app/src/main/AndroidManifest.xml
Fields:
- android:label: Should reference Asafor VTU
- Application name

Action: Verify during asset update
```

---

## Color Implementation

### Primary Color
- **Hex**: `#0B4F6C` (Brand Blue)
- **RGB**: (11, 79, 108)
- **Usage**: Primary buttons, headers, accents

### Accent Colors
- **Gold**: `#C58A17` (RGB: 197, 138, 23)
  - **Usage**: Secondary buttons, highlights, borders
- **Green**: `#4CAF50` (RGB: 76, 175, 80)
  - **Usage**: Success states, positive actions

### Apply Colors To:
1. Logo and brand elements
2. App icon background
3. Splash screen design
4. UI components
5. Gradients and shadows

---

## Asset Design Guidelines

### Logo/Icon Design Requirements
- ✅ Modern and minimal
- ✅ Professional appearance
- ✅ Scalable to all sizes
- ✅ Clear at small sizes (16x16, 20x20)
- ✅ Works in color and monochrome
- ✅ Readable on light and dark backgrounds
- ✅ African-inspired tech aesthetic

### Splash Screen Requirements
- ✅ 1:1 or similar square aspect ratio
- ✅ Include brand colors
- ✅ Feature logo prominently
- ✅ Clean, professional layout
- ✅ Minimal text (brand name only)
- ✅ Provide dark mode variant

### App Icon Requirements
- ✅ Square format (transparent or solid background)
- ✅ Brand colors prominently featured
- ✅ Clear and recognizable at all sizes
- ✅ Consistent across platforms
- ✅ Follows platform guidelines (iOS, Android)

---

## Implementation Checklist

### Phase 1: Prepare Assets
- [ ] Design/obtain AsaPhis symbol in all formats
- [ ] Create color variations (brand colors applied)
- [ ] Prepare icon set (all required sizes)
- [ ] Prepare splash screens (all variants)
- [ ] Get approval on designs

### Phase 2: Replace Assets
- [ ] Update web frontend logo
- [ ] Update web frontend favicon
- [ ] Update admin panel assets
- [ ] Update mobile Android icons
- [ ] Update mobile iOS icons
- [ ] Update mobile splash screens
- [ ] Update web app icons

### Phase 3: Verify Implementation
- [ ] Test web frontend display
- [ ] Test admin panel display
- [ ] Build and test Android app
- [ ] Build and test iOS app
- [ ] Verify icons in all contexts
- [ ] Test on actual devices

### Phase 4: Deploy
- [ ] Push updated assets to repository
- [ ] Update render deployment
- [ ] Update mobile app submissions
- [ ] Verify in production

---

## File Format Recommendations

| Asset Type | Format | Transparency | Color Space |
|------------|--------|--------------|-------------|
| Logos | SVG, PNG | Yes | RGB |
| Favicon | ICO, SVG, PNG | Optional | RGB |
| App Icons | PNG | Yes | RGB |
| Splash Screens | PNG | No | RGB |
| Web Assets | PNG, SVG | Varies | RGB |

---

## Resources & Tools

### Design Tools
- Figma: Vector design and prototyping
- Adobe XD: UI/UX design
- Illustrator: Vector graphics
- ImageMagick: Batch image resizing

### Mobile Asset Generators
- https://romannurik.github.io/AndroidAssetStudio/ (Android)
- https://www.iconspringboard.com/ (iOS)
- https://www.favicon-generator.org/ (Favicon)

---

## Success Criteria

✅ When complete, verify:
1. All assets display brand symbol
2. Brand colors are consistently applied
3. Icons are clear at all sizes
4. Splash screens look professional
5. No old branding remains
6. All platforms display correctly
7. Assets load quickly
8. SVG/PNG optimization is done

---

## Next Steps

1. **Design Phase**: Create/obtain AsaPhis symbol in required formats
2. **Color Application**: Apply brand colors to all assets
3. **Size Generation**: Create all required sizes for each platform
4. **Implementation**: Replace files according to locations listed above
5. **Testing**: Verify on all platforms
6. **Deployment**: Push to production

---

**Asset Management Status**: 🔄 Ready for Implementation
**Expected Completion**: Upon asset creation and deployment
**Repository**: https://github.com/Asaphis/AsaforVTU

For other rebranding details, see: `REBRANDING_COMPLETED.md` and `BRANDING_QUICK_REFERENCE.md`
