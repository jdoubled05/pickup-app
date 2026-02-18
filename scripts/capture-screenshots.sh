#!/bin/bash

# Screenshot Capture Script for App Store
# This script helps capture screenshots at the correct sizes

SCREENSHOTS_DIR="./app-store-assets/screenshots"
mkdir -p "$SCREENSHOTS_DIR"

echo "📸 App Store Screenshot Capture Guide"
echo "======================================"
echo ""
echo "REQUIRED SCREENSHOTS (6.9\" display - iPhone 16 Pro Max):"
echo "- Size: 1320 x 2868 px"
echo "- Minimum: 3 screenshots"
echo "- Maximum: 10 screenshots"
echo ""
echo "SCREENS TO CAPTURE:"
echo "1. Courts List (Hot Now filter showing live activity)"
echo "2. Court Detail (with photos, check-in button, weather)"
echo "3. Map View (with court markers)"
echo "4. Court Detail (Join Game button on hot court)"
echo "5. Saved Courts screen"
echo ""
echo "HOW TO CAPTURE:"
echo "1. Make sure iPhone 16 Pro Max simulator is running"
echo "2. Navigate to each screen in the app"
echo "3. Press: Cmd + S (or Device → Screenshot in Simulator menu)"
echo "4. Screenshots save to: ~/Desktop"
echo ""
echo "TIPS:"
echo "- Use light mode for consistency (Settings → Appearance)"
echo "- Make sure there's good demo data (checked-in courts)"
echo "- Avoid screenshots with your personal location/data"
echo "- Keep status bar clean (full battery, good signal)"
echo ""
echo "After capturing, move screenshots from ~/Desktop to:"
echo "$SCREENSHOTS_DIR"
echo ""
echo "Then we'll frame them with device frames using 'fastlane frameit'"
echo ""

# Function to capture screenshot from running simulator
capture_screenshot() {
  local name=$1
  local device_id="C3A66314-E74D-44FE-ADEA-882059ECA7E7"  # iPhone 16 Pro Max
  local timestamp=$(date +%Y%m%d_%H%M%S)
  local filename="${SCREENSHOTS_DIR}/${name}_${timestamp}.png"

  xcrun simctl io "$device_id" screenshot "$filename"
  echo "✅ Captured: $filename"
}

echo "Ready to capture? Type a screen name and press Enter to capture:"
echo "Example: courts-list"
echo ""
echo "Or press Ctrl+C to exit and capture manually with Cmd+S"
echo ""

# Interactive mode
while true; do
  read -p "Screen name (or 'done' to finish): " screen_name

  if [ "$screen_name" = "done" ]; then
    echo "✨ Screenshot capture complete!"
    echo "Screenshots saved to: $SCREENSHOTS_DIR"
    break
  fi

  if [ -n "$screen_name" ]; then
    capture_screenshot "$screen_name"
  fi
done
