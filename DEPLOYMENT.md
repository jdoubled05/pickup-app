# Deployment Guide - Pickup Basketball App

## 🎯 Environment Setup

You'll have two primary environments:
- **Development** (`dev` branch) → Internal testing builds
- **Production** (`main` branch) → App Store releases

---

## 📋 Prerequisites

1. **Expo CLI**:
   ```bash
   npm install -g expo-cli
   ```

2. **EAS CLI** (for building and submitting):
   ```bash
   npm install -g eas-cli
   eas login
   ```

3. **GitHub CLI** (for creating repo):
   ```bash
   brew install gh
   gh auth login
   ```

4. **Environment Variables**:
   - Copy `.env.example` to `.env`
   - Fill in your Supabase credentials
   - Add WeatherAPI.com API key

---

## 🚀 Initial Setup (One-Time)

### Step 1: Create GitHub Repository

```bash
# Rename master to main (if needed)
git branch -m master main

# Stage files
git add .
git commit -m "Initial commit: Pickup basketball app"

# Create GitHub repo and push
gh repo create pickup-app --public --source=. --push

# Create dev branch
git checkout -b dev
git push -u origin dev

# Switch back to main
git checkout main
```

### Step 2: Configure EAS Build

The project is already configured with EAS. Verify your setup:

```bash
# Check EAS configuration
eas build:configure

# View current project
eas whoami
```

---

## 🔄 Development Workflow

### Making Changes

```bash
# 1. Start on dev branch
git checkout dev

# 2. Make your changes
# Edit files, add features, fix bugs

# 3. Commit and push to dev
git add .
git commit -m "Feature: describe your changes"
git push

# 4. Build development version (optional)
eas build --profile development --platform ios

# 5. When ready for production, merge to main
git checkout main
git merge dev
git push

# 6. Build production version
eas build --profile production --platform ios
```

---

## 📱 Building the App

### Development Builds (Internal Testing)

```bash
# iOS development build
eas build --profile development --platform ios

# Android development build
eas build --profile development --platform android

# Both platforms
eas build --profile development --platform all
```

### Preview Builds (TestFlight/Internal Testing)

```bash
# iOS preview build
eas build --profile preview --platform ios

# Android preview build
eas build --profile preview --platform android
```

### Production Builds (App Store)

```bash
# iOS production build
eas build --profile production --platform ios

# Android production build
eas build --profile production --platform android

# Submit to App Store (after production build)
eas submit --platform ios

# Submit to Google Play
eas submit --platform android
```

---

## 🌐 Environment Variables

### Production (.env)
```env
EXPO_PUBLIC_SUPABASE_URL=https://gvtzdbpdwwjdptikksjv.supabase.co
EXPO_PUBLIC_SUPABASE_LEGACY_ANON_KEY=your_production_key
EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your_production_key
EXPO_PUBLIC_WEATHER_API_KEY=your_weather_key
EXPO_PUBLIC_ENV=production
```

### Development (.env.local - for local development)
```env
# Same as production for now, but could point to different Supabase project
EXPO_PUBLIC_SUPABASE_URL=https://gvtzdbpdwwjdptikksjv.supabase.co
EXPO_PUBLIC_SUPABASE_LEGACY_ANON_KEY=your_dev_key
EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your_dev_key
EXPO_PUBLIC_WEATHER_API_KEY=your_weather_key
EXPO_PUBLIC_ENV=development
```

**Note:** EAS Build profiles automatically set `EXPO_PUBLIC_ENV` during builds.

---

## 🔧 Build Profiles

### Development Profile
- **Purpose:** Local development, debugging
- **Distribution:** Internal
- **Features:** Development client enabled, fast refresh
- **Environment:** `EXPO_PUBLIC_ENV=development`

### Preview Profile
- **Purpose:** Internal testing before production
- **Distribution:** Internal (TestFlight/Internal Testing)
- **Environment:** `EXPO_PUBLIC_ENV=preview`

### Production Profile
- **Purpose:** App Store releases
- **Distribution:** App Store / Google Play
- **Features:** Auto-increment version, optimized build
- **Environment:** `EXPO_PUBLIC_ENV=production`

---

## ✅ Pre-Release Checklist

Before building for production:

- [ ] Update version in `app.json` (or rely on auto-increment)
- [ ] Update app icon if changed
- [ ] Test on physical iOS device
- [ ] Test on physical Android device
- [ ] Verify Supabase environment variables
- [ ] Test check-in functionality
- [ ] Test photo uploads
- [ ] Test map functionality
- [ ] Verify privacy policy URL in app
- [ ] Test location permissions
- [ ] Test camera permissions

---

## 🆘 Troubleshooting

### Build failed?
```bash
# View build logs
eas build:list

# View specific build details
eas build:view [build-id]
```

### Wrong branch?
```bash
git branch  # See current branch
git checkout main  # or 'dev'
```

### Need to clear cache?
```bash
# Clear Expo cache
expo start -c

# Clear Metro bundler cache
rm -rf node_modules/.cache

# Reinstall dependencies
rm -rf node_modules
npm install
```

### Environment variables not working?
```bash
# Verify .env file exists
cat .env

# Rebuild app with fresh environment
eas build --profile production --platform ios --clear-cache
```

---

## 📊 Version Management

EAS automatically increments build numbers in production profile. To manually update:

```json
// app.json
{
  "expo": {
    "version": "1.0.0",  // User-facing version
    "ios": {
      "buildNumber": "1"  // Auto-incremented by EAS
    },
    "android": {
      "versionCode": 1  // Auto-incremented by EAS
    }
  }
}
```

---

## 🔗 Useful Commands

### View all builds
```bash
eas build:list
```

### View project info
```bash
eas project:info
```

### View credentials
```bash
eas credentials
```

### Run locally
```bash
# Start Expo dev server
npm start

# Run on iOS simulator
npm run ios

# Run on Android emulator
npm run android
```

---

## 📞 Resources

- **EAS Build Docs:** https://docs.expo.dev/build/introduction/
- **EAS Submit Docs:** https://docs.expo.dev/submit/introduction/
- **App Store Connect:** https://appstoreconnect.apple.com
- **Google Play Console:** https://play.google.com/console

---

## 🎉 Quick Reference

### Development Cycle
```bash
git checkout dev
# Make changes
git commit -am "Feature: new feature"
git push
eas build --profile development --platform ios
```

### Production Release
```bash
git checkout main
git merge dev
git push
eas build --profile production --platform ios
eas submit --platform ios
```
