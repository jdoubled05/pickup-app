#!/bin/bash

# Pickup App Setup Script
# Automates GitHub repo creation and branch setup

set -e  # Exit on error

echo "🏀 Pickup Basketball App - Dev/Prod Setup"
echo "=========================================="
echo ""

# Check prerequisites
echo "📋 Checking prerequisites..."

if ! command -v gh &> /dev/null; then
    echo "❌ GitHub CLI not found. Install it:"
    echo "   brew install gh"
    exit 1
fi

if ! command -v eas &> /dev/null; then
    echo "❌ EAS CLI not found. Install it:"
    echo "   npm install -g eas-cli"
    exit 1
fi

echo "✅ GitHub CLI found"
echo "✅ EAS CLI found"
echo ""

# Check if user is logged in to GitHub
if ! gh auth status &> /dev/null; then
    echo "🔐 Please log in to GitHub:"
    gh auth login
fi

# Check if user is logged in to EAS
if ! eas whoami &> /dev/null; then
    echo "🔐 Please log in to EAS:"
    eas login
fi

echo ""
echo "Step 1: Preparing Git Repository"
echo "---------------------------------"

# Check if already on main branch
current_branch=$(git branch --show-current)
if [ "$current_branch" = "master" ]; then
    echo "Renaming master to main..."
    git branch -m master main
    echo "✅ Branch renamed to main"
elif [ "$current_branch" != "main" ]; then
    echo "⚠️  Current branch is '$current_branch', switching to main..."
    git checkout main 2>/dev/null || git checkout -b main
fi

echo ""
echo "Step 2: Creating GitHub Repository"
echo "-----------------------------------"

# Check if remote already exists
if git remote get-url origin &> /dev/null; then
    echo "ℹ️  Remote 'origin' already exists:"
    git remote get-url origin
    echo ""
    read -p "Do you want to update it? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        # Initial commit
        git add .
        git commit -m "Setup: Configure dev/prod environments and deployment" || echo "Nothing to commit"
        git push
    fi
else
    # Initial commit
    git add .
    git commit -m "Initial commit: Pickup basketball app with dev/prod setup"

    # Create GitHub repo
    echo "Creating repository 'pickup-app'..."
    gh repo create pickup-app --public --source=. --push

    echo "✅ GitHub repo created and pushed"
fi

echo ""
echo "Step 3: Creating Dev Branch"
echo "---------------------------"

# Create and push dev branch
if git show-ref --verify --quiet refs/heads/dev; then
    echo "ℹ️  Dev branch already exists"
    git checkout dev
    git pull origin dev || echo "No changes to pull"
else
    git checkout -b dev
    git push -u origin dev
    echo "✅ Dev branch created and pushed"
fi

# Switch back to main
git checkout main
echo ""

echo "Step 4: Verifying EAS Configuration"
echo "------------------------------------"

# Show EAS project info
eas project:info || echo "⚠️  Run 'eas build:configure' if needed"

echo ""
echo "🎉 Setup Complete!"
echo "=================="
echo ""
echo "Your repository is ready:"
echo "  GitHub: $(git remote get-url origin 2>/dev/null || echo 'Not yet configured')"
echo "  Main branch: main (production)"
echo "  Dev branch: dev (development)"
echo ""
echo "Next steps:"
echo "  1. Verify .env file has correct credentials"
echo "  2. Test development build: eas build --profile development --platform ios"
echo "  3. Follow DEPLOYMENT.md for detailed workflow"
echo ""
echo "Quick commands:"
echo "  • Switch to dev: git checkout dev"
echo "  • Switch to main: git checkout main"
echo "  • Build dev: eas build --profile development --platform ios"
echo "  • Build prod: eas build --profile production --platform ios"
echo ""
