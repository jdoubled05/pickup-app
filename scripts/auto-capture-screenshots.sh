#!/bin/bash

# Automated Screenshot Capture for App Store
# Captures screenshots from the running iOS simulator

DEVICE_ID="C3A66314-E74D-44FE-ADEA-882059ECA7E7"  # iPhone 16 Pro Max
SCREENSHOTS_DIR="./app-store-assets/screenshots"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

# Create directory
mkdir -p "$SCREENSHOTS_DIR"

echo "📸 Automated App Store Screenshot Capture"
echo "=========================================="
echo ""
echo "Device: iPhone 16 Pro Max (6.9\" display)"
echo "Output: $SCREENSHOTS_DIR"
echo ""

# Function to capture screenshot
capture() {
  local name=$1
  local filename="${SCREENSHOTS_DIR}/${name}.png"

  echo "📷 Capturing: $name..."
  xcrun simctl io "$DEVICE_ID" screenshot "$filename"

  if [ -f "$filename" ]; then
    # Check dimensions
    local size=$(sips -g pixelWidth -g pixelHeight "$filename" 2>/dev/null | grep "pixel" | awk '{print $2}' | tr '\n' 'x' | sed 's/x$//')
    echo "   ✅ Saved: $filename ($size)"
  else
    echo "   ❌ Failed to capture screenshot"
  fi

  echo ""
}

# Instructions
echo "INSTRUCTIONS:"
echo "1. Make sure your app is running on iPhone 16 Pro Max simulator"
echo "2. Navigate to each screen when prompted"
echo "3. Press ENTER after you've positioned each screen"
echo ""
echo "Press ENTER to start..."
read

# Screenshot 1: Courts List
echo "📍 SCREENSHOT 1: Courts List (Hot Now)"
echo "   - Tap 'Hot Now' filter chip"
echo "   - Make sure 2-3 hot courts are visible with player counts"
echo "   - Press ENTER when ready"
read
capture "01-courts-list-hot-now"

# Screenshot 2: Court Detail
echo "📍 SCREENSHOT 2: Court Detail (with Join Game)"
echo "   - Tap on a hot court (one with 3+ players)"
echo "   - Make sure you can see:"
echo "     • Court name and LIVE NOW badge"
echo "     • Weather badge"
echo "     • Player count"
echo "     • Join Game button"
echo "   - Press ENTER when ready"
read
capture "02-court-detail-join-game"

# Screenshot 3: Map View
echo "📍 SCREENSHOT 3: Map View"
echo "   - Tap the Map tab at the bottom"
echo "   - Make sure multiple court markers are visible"
echo "   - Center the map nicely"
echo "   - Press ENTER when ready"
read
capture "03-map-view"

# Screenshot 4: Checked In State
echo "📍 SCREENSHOT 4: Checked In State"
echo "   - Go back to a court detail (back → tap court)"
echo "   - OR if you just joined, stay on that screen"
echo "   - Make sure 'Joined' or 'Checked In' button is visible"
echo "   - Press ENTER when ready"
read
capture "04-checked-in-state"

# Screenshot 5: Photos & Details
echo "📍 SCREENSHOT 5: Photos & Details"
echo "   - On court detail, scroll down a bit"
echo "   - Make sure you can see:"
echo "     • Photo gallery (if photos exist)"
echo "     • Details section (Surface, Hours, Location)"
echo "   - Press ENTER when ready"
read
capture "05-photos-and-details"

# Summary
echo ""
echo "✨ Screenshot capture complete!"
echo ""
echo "Screenshots saved to: $SCREENSHOTS_DIR"
echo ""
echo "Captured files:"
ls -lh "$SCREENSHOTS_DIR"/*.png 2>/dev/null

echo ""
echo "Next steps:"
echo "1. Verify screenshot dimensions: sips -g pixelWidth -g pixelHeight $SCREENSHOTS_DIR/01-*.png"
echo "2. Review screenshots: open $SCREENSHOTS_DIR"
echo "3. Optional: Add device frames with 'fastlane frameit'"
echo "4. Upload to App Store Connect"
echo ""
