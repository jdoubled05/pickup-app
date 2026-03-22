#!/bin/bash
# Take App Store screenshots with demo check-ins seeded.
# Usage: bash scripts/take-screenshots.sh
#
# Prerequisites:
#   - Expo dev server running (npx expo start)
#   - iOS simulator booted with the app installed
#   - .env configured with Supabase credentials

set -e

echo "🌱 Seeding demo check-ins..."
node scripts/seed-demo-checkins.mjs seed

echo ""
echo "📸 Taking main screenshots..."
~/.maestro/bin/maestro test .maestro/screenshots_main.yaml

echo ""
echo "📸 Taking onboarding screenshots..."
~/.maestro/bin/maestro test .maestro/screenshots_onboarding.yaml

echo ""
echo "🧹 Cleaning up demo check-ins..."
node scripts/seed-demo-checkins.mjs cleanup

echo ""
echo "✅ Done. Screenshots saved to app-store-assets/screenshots/"
ls -lh app-store-assets/screenshots/
