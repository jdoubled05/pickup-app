#!/bin/bash

# Script to apply Supabase migrations
# This helps ensure migrations are applied in the correct order

set -e  # Exit on error

echo "🏀 Pickup - Supabase Migration Script"
echo "======================================"
echo ""

# Check if .env file exists
if [ ! -f "../.env" ]; then
    echo "❌ Error: .env file not found"
    echo "Please create a .env file with your Supabase credentials:"
    echo "  EXPO_PUBLIC_SUPABASE_URL=your-project-url"
    echo "  EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key"
    exit 1
fi

# Load environment variables
source ../.env

# Check if Supabase URL is set
if [ -z "$EXPO_PUBLIC_SUPABASE_URL" ]; then
    echo "❌ Error: EXPO_PUBLIC_SUPABASE_URL not set in .env"
    exit 1
fi

echo "📍 Supabase URL: $EXPO_PUBLIC_SUPABASE_URL"
echo ""

# Check if supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "⚠️  Supabase CLI not found"
    echo ""
    echo "You have two options:"
    echo ""
    echo "1. Install Supabase CLI:"
    echo "   npm install -g supabase"
    echo "   Then run this script again"
    echo ""
    echo "2. Apply migrations manually via Supabase Dashboard:"
    echo "   - Go to: $EXPO_PUBLIC_SUPABASE_URL/project/_/sql"
    echo "   - Copy/paste each migration file in order"
    echo "   - Run: 002_update_courts_schema.sql"
    echo "   - Run: 003_create_checkins.sql"
    echo "   - Run: 004_seed_courts.sql (optional)"
    echo ""
    exit 1
fi

echo "✅ Supabase CLI found"
echo ""

# Ask user to confirm
read -p "Apply migrations to $EXPO_PUBLIC_SUPABASE_URL? (y/n) " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ Aborted"
    exit 1
fi

echo ""
echo "📝 Applying migrations..."
echo ""

# Apply migrations in order
migrations=(
    "002_update_courts_schema.sql"
    "003_create_checkins.sql"
    "004_seed_courts.sql"
)

for migration in "${migrations[@]}"; do
    echo "⏳ Applying: $migration"
    if supabase db push --file "migrations/$migration"; then
        echo "✅ Applied: $migration"
    else
        echo "❌ Failed: $migration"
        echo "   Check the error above and fix before continuing"
        exit 1
    fi
    echo ""
done

echo "🎉 All migrations applied successfully!"
echo ""
echo "Next steps:"
echo "1. Verify tables: supabase db dump"
echo "2. Enable Realtime in Dashboard for check_ins table"
echo "3. Test the app!"
echo ""
