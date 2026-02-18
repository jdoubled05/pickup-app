# 🏀 Pickup Basketball App

Find and join pickup basketball games near you in real-time.

## Features

- **Live Activity Feed** - See who's playing at nearby courts right now
- **Court Discovery** - Browse basketball courts with detailed information
- **Real-Time Check-Ins** - Join games and see active player counts
- **Interactive Map** - Find courts on a map with clustering
- **Court Photos** - Upload and browse court images
- **Weather Integration** - View current weather conditions at courts
- **Save Favorites** - Save your favorite courts for quick access
- **Notifications** - Get alerted when players check in nearby

## Tech Stack

- **Framework:** React Native with Expo
- **Routing:** Expo Router (file-based)
- **Styling:** NativeWind (Tailwind CSS for React Native)
- **Backend:** Supabase (PostgreSQL + Real-time subscriptions)
- **Maps:** MapLibre GL
- **State:** React hooks + Zustand (planned)
- **Build:** EAS Build

## Getting Started

### Prerequisites

- Node.js 18+
- Expo CLI
- EAS CLI (for building)
- iOS Simulator or physical device
- Supabase account

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/YOUR_USERNAME/pickup-app.git
   cd pickup-app
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```

   Fill in your credentials:
   - `EXPO_PUBLIC_SUPABASE_URL` - Your Supabase project URL
   - `EXPO_PUBLIC_SUPABASE_LEGACY_ANON_KEY` - Supabase anon key
   - `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY` - Supabase publishable key
   - `EXPO_PUBLIC_WEATHER_API_KEY` - WeatherAPI.com API key

4. **Start the development server**
   ```bash
   npm start
   ```

5. **Run on a device**
   - Press `i` for iOS simulator
   - Press `a` for Android emulator
   - Scan QR code with Expo Go app on physical device

## Project Structure

```
/app                    # Expo Router pages
  /(tabs)              # Tab navigation screens
    /courts            # Courts list and filters
    /map.tsx           # Map view
    /profile.tsx       # User profile
  /court/[id].tsx      # Court detail page
  /saved.tsx           # Saved courts
  /_layout.tsx         # Root layout
/src
  /components          # Reusable components
  /services            # Business logic and API calls
  /types              # TypeScript type definitions
/scripts              # Utility scripts
/assets               # Images, fonts, etc.
```

## Development

### Available Scripts

- `npm start` - Start Expo development server
- `npm run ios` - Run on iOS simulator
- `npm run android` - Run on Android emulator
- `npm run lint` - Run ESLint
- `npm run import-courts` - Import courts from OpenStreetMap
- `npm run create-checkins` - Create demo check-in data

### Building

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed build and deployment instructions.

**Quick build commands:**
```bash
# Development build
eas build --profile development --platform ios

# Production build
eas build --profile production --platform ios

# Submit to App Store
eas submit --platform ios
```

## Database Schema

The app uses Supabase with the following main tables:

- `courts` - Basketball court locations and details
- `check_ins` - Active player check-ins (expires after 2 hours)
- `court_photos` - User-uploaded court images
- `saved_courts` - User's saved favorite courts

Real-time subscriptions are used for live check-in updates.

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `EXPO_PUBLIC_SUPABASE_URL` | Supabase project URL | Yes |
| `EXPO_PUBLIC_SUPABASE_LEGACY_ANON_KEY` | Supabase anonymous key | Yes |
| `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Supabase publishable key | Yes |
| `EXPO_PUBLIC_WEATHER_API_KEY` | WeatherAPI.com API key | Yes |
| `EXPO_PUBLIC_ENV` | Environment (development/production) | Auto-set |

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Deployment

The app uses a dev/prod branching strategy:

- `main` branch → Production builds
- `dev` branch → Development/testing builds

See [DEPLOYMENT.md](./DEPLOYMENT.md) for the complete deployment workflow.

## License

This project is private and proprietary.

## Support

For questions or issues, contact support@pickupbasketball.app

---

Built with ❤️ using [Expo](https://expo.dev) and [Supabase](https://supabase.com)
