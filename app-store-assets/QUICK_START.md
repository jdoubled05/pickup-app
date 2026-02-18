# Quick Start: Capture App Store Screenshots

## Step 1: Start the App
```bash
# Option A: Start on iPhone 16 Pro Max simulator
npx expo start --ios

# Then in Expo, press 'i' and select iPhone 16 Pro Max
```

```bash
# Option B: Direct launch (if simulator already open)
xcrun simctl boot C3A66314-E74D-44FE-ADEA-882059ECA7E7
npx expo start
```

## Step 2: Switch to Light Mode (Recommended)
In the app simulator:
1. Open iOS Settings app
2. Go to Display & Brightness
3. Select "Light" appearance
4. Return to your app

## Step 3: Navigate & Capture

### Screenshot 1: Courts List (Hot Now)
1. Open the app → Courts tab
2. Tap "Hot Now" filter chip
3. Make sure 2-3 courts show with player counts
4. **Press Cmd+S to capture**

### Screenshot 2: Court Detail
1. Tap on a hot court with 3+ players
2. Scroll to show: name, weather, player count, Join Game button
3. **Press Cmd+S to capture**

### Screenshot 3: Map View
1. Tap Map tab at bottom
2. Make sure multiple markers visible
3. Center the map nicely
4. **Press Cmd+S to capture**

### Screenshot 4: Check-In State
1. On court detail, after joining
2. Show "Checked In" button state
3. **Press Cmd+S to capture**

### Screenshot 5: Photos & Details
1. On court detail, scroll down
2. Show photo gallery + details section
3. **Press Cmd+S to capture**

## Step 4: Find Your Screenshots
Screenshots save to: **~/Desktop/**

Files named like: `Simulator Screen Shot - iPhone 16 Pro Max - 2026-02-13 at 14.30.45.png`

## Step 5: Move Screenshots
```bash
# Create folder
mkdir -p app-store-assets/screenshots

# Move from Desktop
mv ~/Desktop/Simulator\ Screen\ Shot*.png app-store-assets/screenshots/

# Rename for clarity
cd app-store-assets/screenshots
mv "Simulator Screen Shot - iPhone 16 Pro Max - 2026-02-13 at 14.30.45.png" "01-courts-list-hot-now.png"
# Repeat for each screenshot
```

## Step 6: Verify
```bash
ls -lh app-store-assets/screenshots/
```

Expected:
- 5-10 PNG files
- Each around 500KB - 2MB
- Size: 1320 x 2868 pixels

Check size:
```bash
sips -g pixelWidth -g pixelHeight app-store-assets/screenshots/01-courts-list-hot-now.png
```

---

## Quick Capture Script

```bash
# Make the script executable
chmod +x scripts/capture-screenshots.sh

# Run it
./scripts/capture-screenshots.sh
```

---

## Troubleshooting

**App not loading?**
- Make sure you ran `npx expo prebuild` recently
- Try: `npx expo run:ios --device "iPhone 16 Pro Max"`

**Screenshots too dark?**
- Switch iOS to light mode in Settings app
- Restart the app

**Status bar looks bad?**
- In Simulator menu: Features → Toggle Status Bar
- Or let Xcode generate clean status bars later

**No demo data showing?**
- You might need test accounts with check-ins
- Ask me to help create demo/seed data

---

## Next Steps After Capture

1. **Frame screenshots** (optional - makes them look professional)
   - Use fastlane frameit
   - Or use Figma template

2. **Add text overlays** (optional - helps explain features)
   - Use Canva, Figma, or Adobe Express
   - Add captions from SCREENSHOT_CHECKLIST.md

3. **Upload to App Store Connect**
   - Go to App Store Connect
   - Select your app
   - Media Manager → Screenshots
   - Drag and drop your images
