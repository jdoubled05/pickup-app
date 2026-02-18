# App Store Screenshot Checklist

## Required Sizes

### iOS App Store
- **6.9" Display (iPhone 16 Pro Max)**: 1320 x 2868 px ⭐ PRIMARY
- **6.5" Display (iPhone 11 Pro Max)**: 1242 x 2688 px (optional)
- **iPad Pro 12.9"**: 2048 x 2732 px (if supporting tablets)

### Google Play Store
- **Phone**: 1080 x 2340 px minimum (or higher resolution 16:9 aspect ratio)
- **7-inch Tablet**: 1200 x 1920 px (optional)
- **10-inch Tablet**: 1920 x 2560 px (optional)

## Screenshot Strategy (5 screenshots recommended)

### Screenshot 1: Courts List with Live Activity ⭐ HERO
**Screen:** Main courts list with "Hot Now" filter active
**Goal:** Show the core value prop - find live games near you

**Setup:**
- Filter: "Hot Now" active
- Show 2-3 hot courts with player counts
- Pulsing "LIVE NOW" indicator visible
- Weather badges showing
- Good mix of indoor/outdoor courts

**Caption:**
"Find live pickup games near you"

---

### Screenshot 2: Court Detail with Check-In ⭐
**Screen:** Court detail page showing active game
**Goal:** Show rich court information and social features

**Setup:**
- Court with 3+ players checked in
- "Join Game" button prominently displayed
- Weather badge visible
- Court photos loaded
- Distance and directions visible

**Caption:**
"See who's playing and join the action"

---

### Screenshot 3: Map View 🗺️
**Screen:** Map tab with court markers
**Goal:** Show visual discovery and geographic coverage

**Setup:**
- Zoom level showing 5-10 court markers
- Mix of regular and "hot" markers (red for active)
- Your location centered or visible
- Clean map view with clear markers

**Caption:**
"Discover courts anywhere you go"

---

### Screenshot 4: Real-Time Updates ⏱️
**Screen:** Court detail showing join button interaction
**Goal:** Emphasize real-time, live aspect

**Setup:**
- Show the check-in button state
- Player count visible
- Live indicator pulsing
- Could be the "Checked In" state

**Caption:**
"Real-time updates when players check in"

---

### Screenshot 5: Court Photos & Info 📸
**Screen:** Court detail scrolled to show photos and details
**Goal:** Show community-contributed photos and rich data

**Setup:**
- Photo gallery with 2-3 photos visible
- Details section showing surface type, hours, location
- Save button visible
- Clean, informative layout

**Caption:**
"See photos and details before you go"

---

## Alternative Screenshots (Optional)

### Saved Courts
**Screen:** Saved courts list
**Setup:** 3-4 saved courts visible
**Caption:** "Save your favorite courts for quick access"

### Submit Court
**Screen:** Submit court form
**Setup:** Partially filled form showing how easy it is
**Caption:** "Help grow the community - add courts you know"

---

## Best Practices

### DO:
- ✅ Use light mode for consistency and readability
- ✅ Show real, compelling data (not empty states)
- ✅ Keep status bar clean (full battery, good signal, no notifications)
- ✅ Use location that's not personally identifiable
- ✅ Show diversity in court types (indoor/outdoor)
- ✅ Make sure all text is readable
- ✅ Highlight unique features (live activity, weather, photos)

### DON'T:
- ❌ Show personal/private location information
- ❌ Use placeholder or Lorem Ipsum text
- ❌ Show error states or loading screens
- ❌ Include copyrighted content in photos
- ❌ Show empty lists or "no results"
- ❌ Have blurry or low-quality images

---

## Capture Instructions

### Using Simulator (Recommended)
1. Open iPhone 16 Pro Max simulator
2. Navigate to the screen you want to capture
3. Press **Cmd + S** to capture screenshot
4. Screenshot saves to `~/Desktop`
5. Move to `app-store-assets/screenshots/`

### Using Script
```bash
./scripts/capture-screenshots.sh
```

### Using Command Line
```bash
xcrun simctl io C3A66314-E74D-44FE-ADEA-882059ECA7E7 screenshot ~/Desktop/screenshot.png
```

---

## Post-Processing

### 1. Add Device Frames (Optional but Professional)
```bash
# Install fastlane
brew install fastlane

# Install frameit
fastlane frameit setup

# Frame screenshots
fastlane frameit
```

### 2. Add Text Overlays (Optional)
Tools:
- **Figma** - Free, professional
- **Canva** - Easy to use
- **Sketch** - Mac only, paid
- **Adobe Express** - Quick and simple

### 3. Optimize File Size
```bash
# Install ImageOptim
brew install imageoptim

# Or use command line
pngquant --quality=80-95 screenshot.png
```

---

## App Store Connect Upload Checklist

- [ ] 5-10 screenshots captured
- [ ] All screenshots are 1320 x 2868 px (iPhone 16 Pro Max)
- [ ] Screenshots show diverse features
- [ ] No personal information visible
- [ ] Status bars look clean
- [ ] Text is readable and high-contrast
- [ ] Device frames added (optional)
- [ ] Text overlays added (optional)
- [ ] Files are properly named
- [ ] Files are under 500KB each (if possible)
- [ ] Screenshots are in order 1-5 (most important first)

---

## Screenshot Order in App Store

**The first 2-3 screenshots are the most important!** They show in search results.

**Recommended order:**
1. Courts List with Live Activity (HERO - shows main value)
2. Court Detail with Check-In (shows engagement)
3. Map View (shows discovery)
4. Real-Time Updates (shows live aspect)
5. Court Photos & Info (shows community/data quality)
