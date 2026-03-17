# 🏀 Pickup - Product Specification

> **Last Updated:** 2026-03-14
> **Version:** 1.0.0
> **Status:** MVP Near-Complete — Final Polish Phase

---

## 📋 Table of Contents

1. [Product Overview](#product-overview)
2. [Technical Architecture](#technical-architecture)
3. [Feature Specifications](#feature-specifications)
4. [Data Models](#data-models)
5. [UI/UX Guidelines](#uiux-guidelines)
6. [API Integration](#api-integration)
7. [Testing Requirements](#testing-requirements)
8. [Development Guidelines](#development-guidelines)

---

## Product Overview

### Mission Statement
Help basketball players find active pickup games at nearby courts through real-time check-ins and location-based discovery.

### Target Users
- Basketball players looking for pickup games
- People new to an area seeking local courts
- Casual players wanting to find active courts
- Age range: 16-45, mobile-first, tech-savvy

### Core Value Proposition
**"See who's playing right now, not just where courts are."**

Unlike traditional court finders that only show locations, Pickup shows real-time activity through user check-ins, solving the actual problem: finding active games.

### MVP Scope
**In Scope:**
- Location-based court discovery (dynamic radius)
- Court details (indoor/outdoor, hoops, lighting, hours, surface, court size)
- Real-time check-ins with 3-hour expiration + auto-checkout
- Save/unsave favorite courts
- Get directions to courts
- Search and filter courts (list + map)
- Map view with clustering and real-time activity indicators
- Onboarding flow

**Out of Scope (Post-MVP):**
- User accounts/authentication
- Court photos (upload + display)
- Ratings and reviews
- Game scheduling
- Social features beyond check-ins
- Court condition reporting
- Push notifications
- User profiles
- Share & deep linking

---

## Technical Architecture

### Tech Stack

#### Frontend
- **Framework:** React Native 0.81.5
- **React:** 19.1.0
- **Navigation:** Expo Router 6.0.22 (file-based routing)
- **Styling:** NativeWind 4.2.1 (Tailwind for React Native)
- **State Management:** React hooks (useState, useEffect, useCallback, useMemo)
- **Maps:** react-native-maps with Supercluster for clustering

#### Backend
- **BaaS:** Supabase (PostgreSQL + Storage + Realtime)
- **Database:** PostgreSQL with PostGIS for geospatial queries
- **Realtime:** Supabase Realtime subscriptions (check-ins + court activity)

#### Data
- **Court Data:** 827 Atlanta metro courts
  - OSM outdoor courts via `scripts/import-osm-courts.ts`
  - Google Places indoor courts (YMCAs, rec centers) via `scripts/import-google-courts.ts`
  - Deduplication: 50m proximity threshold, geographic bounds filter

#### Developer Tools
- **Build Tool:** Expo 54.0.32
- **OTA Updates:** EAS Update (branch: `preview`)
- **Language:** TypeScript 5.9.2
- **Linting:** ESLint with Expo config

### App Architecture

```
app/
├── (tabs)/                 # Main tab navigation
│   ├── courts/            # Courts list (main feed)
│   ├── map.tsx            # Map view of courts
│   └── profile.tsx        # User profile/settings
├── court/
│   └── [id].tsx           # Court detail page
├── saved.tsx              # Saved courts list
└── welcome.tsx            # Onboarding flow (shows on first launch)

src/
├── components/
│   ├── ui/                # Reusable UI components (Text, Button, etc.)
│   ├── Map/               # Map-specific components
│   │   ├── CourtsMap.tsx          # Map with Supercluster clustering
│   │   └── BottomSheetCourtPreview.tsx
│   ├── BasketballRefreshControl.tsx
│   └── FilterModal.tsx    # Shared filter modal
├── services/
│   ├── courts.ts          # Court data operations (listCourtsNearby, searchCourts)
│   ├── savedCourts.ts     # AsyncStorage saved courts
│   ├── checkins.ts        # Check-in CRUD + realtime
│   ├── courtActivity.ts   # Batch activity + realtime subscriptions
│   ├── courtFilters.ts    # Filter logic + AsyncStorage persistence
│   ├── location.ts        # Geolocation, geocoding, city autocomplete
│   └── supabase.ts        # Supabase client + env status
└── types/                 # TypeScript definitions
```

### Data Flow

1. **Court Discovery:**
   - User opens app → Request location permission
   - Get device location (or default to Atlanta center)
   - Query Supabase RPC `courts_nearby(lat, lon, radius)` — up to 1000 courts
   - Display sorted by distance

2. **Check-ins:**
   - User taps "I'm Here" → Create check-in record
   - Supabase realtime broadcasts to all viewers
   - UI updates optimistically + confirms on success
   - Check-ins expire after 3 hours; auto-checkout on expiry
   - User can only check in to one court at a time

3. **Saved Courts:**
   - Local-first (AsyncStorage) — no backend sync
   - Observable pattern for reactivity across screens

4. **Map Activity:**
   - `getCourtActivityBatch` fetches active check-in counts for all visible courts
   - `subscribeToActivityUpdates` maintains real-time channel per session
   - Courts with active check-ins shown with 🔥 flame markers

---

## Feature Specifications

### F1: Court Discovery & List View ✅

**Priority:** P0 (Must Have)
**Status:** ✅ Complete

**Acceptance Criteria:**
- [x] Shows courts within user's area (default 50km, adjusts with map viewport)
- [x] Falls back to default location (Atlanta, 33.749, -84.388) if permission denied
- [x] Displays: court name, address, distance, indoor/outdoor, hoops, lighting, court size
- [x] Sorted by distance (closest first)
- [x] Pull-to-refresh updates list (BasketballRefreshControl)
- [x] Shows loading skeleton while fetching
- [x] Shows empty state if no courts found
- [x] Tapping court navigates to detail page
- [x] Search bar with court name/address/city autocomplete
- [x] "X courts nearby" with 🔥 live badge when active courts exist
- [x] Logo header centered, no tagline
- [x] Keyboard dismisses when tapping header

**Key Files:**
- `app/(tabs)/courts/index.tsx`

---

### F2: Court Detail Page ✅

**Priority:** P0 (Must Have)
**Status:** ✅ Complete

**Acceptance Criteria:**
- [x] Shows: name, address, indoor/outdoor, surface type, court size, hoops, lighting, hours
- [x] Displays active check-ins count ("3 people here now")
- [x] "Get Directions" button opens Maps app (Apple Maps on iOS, Google Maps on Android)
- [x] "I'm Here" check-in button (toggles, auto-expires at 3h)
- [x] Save/unsave button with haptic feedback
- [x] Real-time updates when check-ins change
- [x] Hours formatted from JSON to readable format
- [x] Pull-to-refresh

**Key Files:**
- `app/court/[id].tsx`
- `src/services/checkins.ts`

---

### F3: Real-Time Check-Ins ✅

**Priority:** P0 (Must Have — Core Differentiator)
**Status:** ✅ Complete

**Acceptance Criteria:**
- [x] "I'm Here" button on court detail page
- [x] Shows count: "3 people here now" or "No one here yet"
- [x] Check-in expires after 3 hours automatically
- [x] Real-time updates (no refresh needed)
- [x] Optimistic UI (instant feedback)
- [x] Anonymous check-ins (no account required) — device ID via expo-constants
- [x] User can only check in to one court at a time
- [x] Tapping "I'm Here" again removes check-in
- [x] Auto-checkout when expiry timer fires client-side

**Database Schema:**
```sql
create table check_ins (
  id uuid primary key default uuid_generate_v4(),
  court_id text not null references courts(id) on delete cascade,
  anonymous_user_id text not null,
  created_at timestamp with time zone default now(),
  expires_at timestamp with time zone default (now() + interval '3 hours')
);
```

**Key Files:**
- `src/services/checkins.ts`
- `src/services/courtActivity.ts`

---

### F4: Get Directions ✅

**Priority:** P0 (Must Have)
**Status:** ✅ Complete

**Acceptance Criteria:**
- [x] "Get Directions" button on court detail page
- [x] Opens native Maps app with court location
- [x] Works on iOS (Apple Maps) and Android (Google Maps)
- [x] Handles missing lat/lon gracefully

---

### F5: Save Courts ✅

**Priority:** P0 (Must Have)
**Status:** ✅ Complete

**Acceptance Criteria:**
- [x] Save/unsave button on court detail page
- [x] Visual indicator when saved
- [x] Saved courts list accessible from profile tab
- [x] Persists across app restarts (AsyncStorage)
- [x] Remove from saved list
- [x] Haptic feedback on save/unsave

---

### F6: Court Photos

**Priority:** P1 (High Priority)
**Status:** ⬜ Post-MVP

Deferred to post-launch. Will use Supabase Storage + expo-image-picker.

---

### F7: Filter & Search ✅

**Priority:** P1 (High Priority)
**Status:** ✅ Complete

**Acceptance Criteria:**
- [x] Search bar on courts list (name, address, city)
- [x] Search bar on map (courts + city autocomplete via Nominatim)
- [x] Filter modal: Indoor/Outdoor, Lighting, Active now, Court size (Full/Half/Both)
- [x] Filter by number of hoops: Any, 2+, 4+, 6+
- [x] Filters persist across sessions (AsyncStorage)
- [x] Active filter indicator on filter button
- [x] Available on both courts list and map screens

**Key Files:**
- `src/services/courtFilters.ts`
- `src/components/FilterModal.tsx`
- `app/(tabs)/courts/index.tsx`
- `app/(tabs)/map.tsx`

---

### F8: Share Court

**Priority:** P1 (High Priority)
**Status:** ⬜ Post-MVP

Deferred. Will use expo-sharing + deep links.

---

### F9: Onboarding Flow ✅

**Priority:** P2 (Nice to Have)
**Status:** ✅ Complete

**Acceptance Criteria:**
- [x] Shows on first launch only
- [x] Multi-screen carousel (Welcome, Features, Location/Access)
- [x] "Get Started" navigates to main app
- [x] Never shows again after completion (AsyncStorage flag)

**Key Files:**
- `app/welcome.tsx`

---

### F10: Map View ✅

**Priority:** P2 (Nice to Have)
**Status:** ✅ Complete — significantly beyond original spec

**Acceptance Criteria:**
- [x] Map tab shows all courts as pins (up to 1000 from DB)
- [x] Court clustering via Supercluster (radius: 30px, maxZoom: 16)
  - Cluster tapping zooms in to expand
  - Cluster badge shows court count
  - Clusters with active courts show 🔥
- [x] Individual courts: location pin (🔥 overlay when active)
- [x] Tap pin → bottom sheet court preview → navigate to detail
- [x] Recenter + Refresh buttons
- [x] Search bar with court name and city autocomplete
  - City suggestions: DB courts (instant, proximity-sorted) + Nominatim (500ms debounce, location-biased)
  - Court suggestions: name/address match from Supabase searchCourts
- [x] Filter modal (same filters as courts list, persisted)
- [x] Dynamic fetch radius matches visible viewport (half-diagonal, 5–200km clamp)
- [x] Dark mode map style
- [x] Programmatic re-center on search/recenter without stuck update loops
- [x] Zoom out fix: clamped zoom (0–20), clamped bbox (±180/±85)

**Key Files:**
- `app/(tabs)/map.tsx`
- `src/components/Map/CourtsMap.tsx`
- `src/components/Map/BottomSheetCourtPreview.tsx`

---

## Data Models

### Court

```typescript
interface Court {
  id: string;
  name: string;
  description: string | null;
  latitude: number;
  longitude: number;
  address: string | null;
  city: string | null;
  state: string | null;
  postal_code: string | null;
  country: string;
  timezone: string;
  indoor: boolean | null;
  surface_type: string | null;
  num_hoops: number | null;
  lighting: boolean | null;
  court_size: 'full' | 'half' | 'both' | null; // mapped from DB full_court boolean
  open_24h: boolean;
  hours_json: unknown | null;
  amenities_json: string[] | null;
  photos_count: number;
  photo_url: string | null;
  is_free: boolean | null;
  is_public: boolean | null;
  source: string | null;          // 'osm' | 'google' | 'manual'
  google_place_id: string | null;
  osm_type: string | null;
  osm_id: string | null;
  created_at: string;
  updated_at: string;
  distance_meters?: number;       // computed by courts_nearby RPC
}
```

### CheckIn

```typescript
interface CheckIn {
  id: string;
  court_id: string;
  anonymous_user_id: string;
  created_at: string;
  expires_at: string;
}
```

### CourtFilters

```typescript
interface CourtFilters {
  indoorOutdoor: 'all' | 'indoor' | 'outdoor';
  lighting: 'all' | 'yes' | 'no';
  minHoops: 0 | 2 | 4 | 6;
  activeOnly: boolean;
  courtSize: 'all' | 'full' | 'half' | 'both';
}
```

### Supabase RPC Functions

```sql
-- Get nearby courts with distance (returns up to 1000)
create or replace function courts_nearby(
  lat double precision,
  lon double precision,
  radius_meters integer,
  limit_count integer default 1000
)
returns table ( ... distance_meters double precision )
-- Orders by distance ASC, uses ST_DWithin on geography column

-- Get court by ID
create or replace function court_by_id(court_id text)
returns setof courts

-- Active check-ins for a court (expires_at > now())
create or replace function get_active_checkins(p_court_id text)
returns setof check_ins
```

### DB Schema Notes (Live, differs from migrations)

- `latitude` / `longitude` are real columns (not removed)
- `location geography` is nullable, populated by trigger from lat/lon
- `osm_id` is `text` (not bigint)
- `full_court boolean` is the actual DB column; TypeScript `court_size` maps it
- `source` and `google_place_id` added by migration 008

---

## UI/UX Guidelines

### Design System

**Colors:**
- Background: `#000000` / `bg-black`
- Brand: `#960000` (dark red)
- Text Primary: `#FFFFFF`
- Text Secondary: `rgba(255, 255, 255, 0.7)`
- Text Tertiary: `rgba(255, 255, 255, 0.5)`
- Borders: `rgba(255, 255, 255, 0.1)`
- Card Background: `rgba(255, 255, 255, 0.05)`

**Typography:**
- Headings: Bold, 2xl-3xl
- Body: Regular, base
- Meta: Regular, sm-xs, low opacity

**Components:**
- Rounded corners: `rounded-2xl`
- Cards: `border border-white/10 bg-white/5 p-4 rounded-2xl`
- Buttons: Primary (white bg) or Secondary (white/10 border)
- Screen padding: `px-6 py-6`

### Interaction Patterns

**Loading States:** Skeleton loaders, never blank screens
**Error States:** User-friendly messages, retry actions
**Empty States:** Explain why + provide action
**Haptic Feedback:** Save/unsave (Medium), check-in (Medium), errors (Notification)

### Accessibility
- Minimum 44pt tappable areas
- `accessibilityLabel` on all interactive elements
- Sufficient color contrast

---

## API Integration

### Supabase Setup

**Environment Variables:**
```env
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

Always use `getSupabaseEnvStatus()` to check if configured. Fall back to mock data if not.

### Location Services

**`src/services/location.ts` exports:**
- `getForegroundLocationOrDefault()` — requests permission, falls back to Atlanta
- `geocodeAddress(query)` — Nominatim geocoder, ZIP-aware
- `autocompleteCities(query, bias?)` — Nominatim city autocomplete with viewbox bias
- `DEFAULT_CENTER` — Atlanta `{ lat: 33.749, lon: -84.388 }`

---

## Testing Requirements

### E2E Testing: Maestro

**Setup:**
```bash
# Install (macOS)
brew install maestro

# Verify
maestro --version
```

**Project structure:**
```
.maestro/
├── courts-list.yaml       # Browse and search courts list
├── court-detail.yaml      # View court detail, check in, get directions
├── map-search.yaml        # Map search and navigation
├── save-courts.yaml       # Save/unsave flow
├── filters.yaml           # Apply and clear filters
└── onboarding.yaml        # First-launch onboarding
```

**Running tests:**
```bash
# Run single flow
maestro test .maestro/courts-list.yaml

# Run all flows
maestro test .maestro/

# Run on specific device
maestro test --device <device-id> .maestro/courts-list.yaml
```

**Example flow (`courts-list.yaml`):**
```yaml
appId: com.pickup.app
---
- launchApp
- assertVisible: "courts"       # tab visible
- tapOn: "courts"
- waitForAnimationToEnd
- assertVisible:
    text: "nearby"
    enabled: true
- tapOn:
    id: "search-input"
- inputText: "Duluth"
- assertVisible: "Duluth, GA"
- tapOn: "Duluth, GA"
- waitForAnimationToEnd
- assertVisible: "courts"
```

**Claude-assisted test generation:**
Provide Claude with a user journey description and `PRODUCT_SPEC.md`. Claude can generate complete Maestro YAML flows covering happy paths and edge cases for any feature.

### Manual Testing Checklist

**Before Each Build:**
- [ ] `npx tsc --noEmit` — no TypeScript errors
- [ ] No console errors/warnings in dev
- [ ] Test on iOS simulator

**Before OTA Push (`eas update`):**
- [ ] Core flows work: browse courts, view detail, check in, save, map search
- [ ] Works with Supabase enabled and disabled (mock data)
- [ ] Loading and error states display correctly
- [ ] Dark mode renders correctly

**Before App Store Submission:**
- [ ] Test on physical iOS device
- [ ] Test location permission denied
- [ ] Test offline/airplane mode
- [ ] Test app backgrounding/foregrounding
- [ ] No debug UI or console.logs
- [ ] Performance: no jank on map with 800+ courts

### Edge Cases

1. **Location:** permission denied → default Atlanta; slow → loading state
2. **Network:** offline → mock data or cached; slow → loading states
3. **Map:** zoom out fully → courts still cluster (not disappear); viewport radius caps at 200km
4. **Check-ins:** expire mid-session → auto-checkout fires; multiple courts → only one active
5. **Search:** city not in DB → Nominatim fallback; partial city name → DB prefix match

---

## Implementation Priority

### Phase 1: Core MVP ✅ Complete
1. ✅ Court discovery + list view
2. ✅ Court detail page
3. ✅ Real-time check-ins
4. ✅ Get directions
5. ✅ Save/unsave courts with haptics
6. ✅ Map view with clustering + activity
7. ✅ Search (courts list + map)
8. ✅ Filters (indoor/outdoor, lighting, hoops, active, court size)
9. ✅ Onboarding flow
10. ✅ Dark mode
11. ✅ 827 Atlanta metro courts imported

### Phase 2: Post-Launch
1. ⬜ Court photos (upload + display)
2. ⬜ Share & deep linking
3. ⬜ E2E Maestro test suite
4. ⬜ Analytics (Posthog or similar)
5. ⬜ Push notifications for active courts nearby
6. ⬜ Expand to additional cities

### Phase 3: Growth
7. ⬜ User feedback / court reports
8. ⬜ `search_cities` Supabase RPC for better city autocomplete
9. ⬜ Rate limiting for check-in spam
10. ⬜ Court condition reporting

---

## Development Guidelines

### Code Style
- TypeScript: explicit types on all params and returns, no `any`
- Components: Imports → Types → Component → Exports
- Use `useMemo` for expensive computations, `useCallback` for child function props
- NativeWind classes over StyleSheet.create

### Git / OTA Workflow
```bash
# OTA update (preferred for JS-only changes)
CI=1 eas update --platform ios --branch preview --message "feat: ..."

# Native changes require full build
npx expo run:ios
```

### Import Scripts
```bash
# Seed courts (run OSM first, then Google)
npm run import-courts -- --city="atlanta" --metro
npm run import-google-courts

# Geographic bounds filter in import-google-courts.ts
# prevents non-Atlanta courts from being imported
```

---

## Questions & Decisions Log

### Decided
1. **Anonymous check-ins:** Device ID via expo-constants, stored in AsyncStorage
2. **Check-in duration:** 3 hours (typical game length)
3. **Court photos:** Post-MVP (reduces launch complexity)
4. **Web support:** No, mobile-only
5. **Court limit:** 1000 per query (covers full Atlanta metro)
6. **Clustering radius:** 30px (less aggressive than default 50px)
7. **Map radius:** Dynamic (half-diagonal of viewport), clamped 5–200km
8. **City suggestions:** DB courts (proximity-sorted) + Nominatim (location-biased viewbox)

### Open Questions
1. How do we handle spam/fake check-ins? (Post-MVP: rate limiting)
2. What analytics events should we track? (TBD)
3. Expand to other cities: user-driven or curated? (TBD)

---

## References

- **MVP Launch Plan:** `MVP_Launch_Plan.md`
- **Supabase Docs:** https://supabase.com/docs
- **Expo Docs:** https://docs.expo.dev
- **NativeWind Docs:** https://www.nativewind.dev
- **Maestro Docs:** https://maestro.mobile.dev

---

**For Claude Code Developer:**

When implementing features:
1. Read this spec for requirements
2. Check existing code in `src/services/` and `app/`
3. Follow code style guidelines above
4. Test on iOS simulator minimum, physical device before major releases
5. Use `CI=1 eas update` for OTA-eligible changes (JS only)
6. Update this spec when features ship or requirements change
