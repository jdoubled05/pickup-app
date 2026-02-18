# 🏀 Pickup - Product Specification

> **Last Updated:** 2026-02-13
> **Version:** 1.0.0
> **Status:** In Development - MVP Phase

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
- Location-based court discovery (50km radius)
- Court details (indoor/outdoor, hoops, lighting, hours, surface)
- Real-time check-ins with 3-hour expiration
- Save/unsave favorite courts
- Get directions to courts
- Court photos (1 per court)
- Search and filter courts
- Share courts with friends

**Out of Scope (Post-MVP):**
- User accounts/authentication
- Ratings and reviews
- Game scheduling
- Social features beyond check-ins
- Court condition reporting
- Push notifications
- User profiles

---

## Technical Architecture

### Tech Stack

#### Frontend
- **Framework:** React Native 0.81.5
- **React:** 19.1.0
- **Navigation:** Expo Router 6.0.22 (file-based routing)
- **Styling:** NativeWind 4.2.1 (Tailwind for React Native)
- **State Management:** React hooks (useState, useEffect, useCallback)
- **Maps:** MapLibre React Native 10.4.2

#### Backend
- **BaaS:** Supabase (PostgreSQL + Storage + Realtime)
- **Database:** PostgreSQL (via Supabase)
- **Storage:** Supabase Storage (court photos)
- **Realtime:** Supabase Realtime subscriptions

#### Developer Tools
- **Build Tool:** Expo 54.0.32
- **Language:** TypeScript 5.9.2
- **Linting:** ESLint with Expo config
- **Version Control:** Git

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
├── welcome.tsx            # Onboarding flow
└── _layout.tsx            # Root layout

src/
├── components/
│   ├── ui/                # Reusable UI components
│   └── Map/               # Map-specific components
├── services/              # Business logic & API calls
│   ├── courts.ts          # Court data operations
│   ├── savedCourts.ts     # Local saved courts
│   ├── checkins.ts        # Check-in operations
│   ├── location.ts        # Geolocation services
│   └── supabase.ts        # Supabase client
└── types/                 # TypeScript definitions
    ├── courts.ts
    ├── checkins.ts
    └── db.ts
```

### Data Flow

1. **Court Discovery:**
   - User opens app → Request location permission
   - Get device location (or default to Atlanta)
   - Query Supabase RPC `courts_nearby(lat, lon, radius)`
   - Display sorted by distance

2. **Check-ins:**
   - User taps "I'm Here" → Create check-in record
   - Supabase realtime broadcasts to all viewers
   - UI updates optimistically + confirms on success
   - Background job expires check-ins after 3 hours

3. **Saved Courts:**
   - Local-first (AsyncStorage) for offline access
   - No backend sync required for MVP
   - Hydrate on app launch
   - Observable pattern for reactivity

---

## Feature Specifications

### F1: Court Discovery & List View

**Priority:** P0 (Must Have)

**User Story:**
As a user, I want to see nearby basketball courts sorted by distance so I can find courts close to me.

**Acceptance Criteria:**
- [ ] Shows courts within 50km radius of user location
- [ ] Falls back to default location (Atlanta) if permission denied
- [ ] Displays: court name, address, distance, indoor/outdoor, hoops, lighting
- [ ] Sorted by distance (closest first)
- [ ] Pull-to-refresh updates list
- [ ] Shows loading skeleton while fetching
- [ ] Shows empty state if no courts found
- [ ] Tapping court navigates to detail page

**Implementation Notes:**
- Use `getForegroundLocationOrDefault()` from location service
- Call `listCourtsNearby(lat, lon, 50000)` from courts service
- Memoize sorted courts to prevent re-renders
- Show "X courts nearby" in header

**Files to Modify:**
- `app/(tabs)/courts/index.tsx` (already implemented, needs polish)

---

### F2: Court Detail Page

**Priority:** P0 (Must Have)

**User Story:**
As a user, I want to see detailed information about a court so I can decide if I want to visit.

**Acceptance Criteria:**
- [ ] Shows: name, address, photo, indoor/outdoor, surface type, hoops, lighting, hours
- [ ] Displays active check-ins count ("3 people here now")
- [ ] "Get Directions" button opens Maps app
- [ ] "I'm Here" check-in button (toggles state)
- [ ] Save/unsave button (with haptic feedback)
- [ ] Share button (native share sheet)
- [ ] Real-time updates when check-ins change

**Implementation Notes:**
- Use `getCourtById(id)` to fetch data
- Subscribe to check-ins changes via Supabase realtime
- Use `Linking.openURL()` for directions:
  - iOS: `maps://maps.apple.com/?q=lat,lon`
  - Android: `geo:lat,lon?q=lat,lon`
- Format hours: convert `{"open": "06:00", "close": "22:00"}` → "6:00 AM - 10:00 PM"

**Files to Modify:**
- `app/court/[id].tsx` (exists, needs directions + check-ins)
- Create `src/services/checkins.ts` (new)

---

### F3: Real-Time Check-Ins ✅

**Priority:** P0 (Must Have - Core Differentiator)
**Status:** ✅ Implemented

**User Story:**
As a user, I want to check in when I arrive at a court and see who else is there so I know if there's an active game.

**Acceptance Criteria:**
- [x] "I'm Here" button on court detail page
- [x] Shows count: "3 people here now" or "No one here yet"
- [x] Check-in expires after 3 hours automatically
- [x] Real-time updates (no refresh needed)
- [x] Optimistic UI (instant feedback)
- [x] Anonymous check-ins (no account required)
- [x] User can only check in to one court at a time
- [x] Tapping "I'm Here" again removes check-in

**Database Schema:**
```sql
create table check_ins (
  id uuid primary key default uuid_generate_v4(),
  court_id text not null references courts(id) on delete cascade,
  anonymous_user_id text not null,
  created_at timestamp with time zone default now(),
  expires_at timestamp with time zone default (now() + interval '3 hours')
);

create index idx_check_ins_court on check_ins(court_id);
create index idx_check_ins_expires on check_ins(expires_at);
create index idx_check_ins_user on check_ins(anonymous_user_id);

-- Enable realtime
alter publication supabase_realtime add table check_ins;
```

**Implementation Notes:**
- Generate `anonymous_user_id` using `expo-constants` deviceId
- Store in AsyncStorage for consistency
- Use Supabase `.insert()` to create check-in
- Subscribe to changes: `supabase.from('check_ins').on('*', callback).subscribe()`
- Query active check-ins: `expires_at > now()`
- Auto-remove expired check-ins client-side

**New Files:**
- `src/services/checkins.ts`
- `src/types/checkins.ts`

**Files to Modify:**
- `app/court/[id].tsx`

---

### F4: Get Directions ✅

**Priority:** P0 (Must Have)
**Status:** ✅ Implemented

**User Story:**
As a user, I want to get directions to a court so I can navigate there easily.

**Acceptance Criteria:**
- [x] "Get Directions" button on court detail page
- [x] Opens native Maps app with court location
- [x] Works on both iOS (Apple Maps) and Android (Google Maps)
- [x] Handles cases where lat/lon are missing gracefully

**Implementation:**
```typescript
import { Linking, Platform } from 'react-native';

const openDirections = (lat: number, lon: number, name: string) => {
  const scheme = Platform.select({
    ios: 'maps://maps.apple.com/',
    android: 'geo:',
  });

  const url = Platform.select({
    ios: `${scheme}?q=${encodeURIComponent(name)}&ll=${lat},${lon}`,
    android: `${scheme}${lat},${lon}?q=${lat},${lon}(${encodeURIComponent(name)})`,
  });

  Linking.openURL(url);
};
```

**Files to Modify:**
- `app/court/[id].tsx`
- Create `src/utils/directions.ts`

---

### F5: Save Courts

**Priority:** P0 (Must Have)

**User Story:**
As a user, I want to save my favorite courts so I can quickly access them later.

**Acceptance Criteria:**
- [x] Save/unsave button on court detail page
- [x] Visual indicator when saved (different button style)
- [x] Saved courts list accessible from main screen
- [x] Shows saved count in multiple places
- [x] Persists across app restarts
- [x] Remove from saved list
- [ ] Add haptic feedback on save/unsave

**Implementation Notes:**
- Already implemented using AsyncStorage
- Add haptic feedback: `import * as Haptics from 'expo-haptics'; Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);`

**Files to Modify:**
- `src/services/savedCourts.ts` (add haptics)
- `app/court/[id].tsx` (add haptics)

---

### F6: Court Photos

**Priority:** P1 (High Priority)

**User Story:**
As a user, I want to see photos of courts so I know what they look like before visiting.

**Acceptance Criteria:**
- [ ] Display court photo on detail page (if exists)
- [ ] Upload photo button (1 photo per court for MVP)
- [ ] Photo compresses before upload (<1MB)
- [ ] Fallback placeholder if no photo
- [ ] Loading state during upload
- [ ] Photos stored in Supabase Storage

**Storage Schema:**
```sql
-- Create bucket
insert into storage.buckets (id, name, public)
values ('court-photos', 'court-photos', true);

-- RLS policies
create policy "Photos are publicly accessible"
on storage.objects for select
using ( bucket_id = 'court-photos' );

create policy "Anyone can upload photos"
on storage.objects for insert
with check ( bucket_id = 'court-photos' );
```

**Implementation:**
```typescript
import * as ImagePicker from 'expo-image-picker';

// Pick image
const result = await ImagePicker.launchImageLibraryAsync({
  mediaTypes: ImagePicker.MediaTypeOptions.Images,
  allowsEditing: true,
  aspect: [16, 9],
  quality: 0.7,
});

// Upload to Supabase
const { data, error } = await supabase.storage
  .from('court-photos')
  .upload(`${courtId}.jpg`, file);
```

**New Files:**
- `src/services/photos.ts`

**Files to Modify:**
- `app/court/[id].tsx`
- Update `Court` type to include `photo_url`

---

### F7: Filter & Search

**Priority:** P1 (High Priority)

**User Story:**
As a user, I want to filter courts by type and search by name so I can find specific courts.

**Acceptance Criteria:**
- [ ] Search bar filters by court name or address
- [ ] Filter chips: All, Indoor, Outdoor, Lighting, No Lighting
- [ ] Filter by number of hoops: 2+, 4+, 6+
- [ ] Filters persist during session
- [ ] Clear filters button
- [ ] Show count: "42 courts (5 filtered)"

**Implementation Notes:**
- Client-side filtering (don't re-query Supabase)
- Use `useMemo` for performance
- Store filter state in component

**Files to Modify:**
- `app/(tabs)/courts/index.tsx`
- Create `src/components/CourtFilters.tsx`

---

### F8: Share Court

**Priority:** P1 (High Priority)

**User Story:**
As a user, I want to share a court with friends so they can see it too.

**Acceptance Criteria:**
- [ ] Share button on court detail page
- [ ] Opens native share sheet
- [ ] Share text includes: court name, address, app link
- [ ] Deep link opens app to court detail
- [ ] Works on both iOS and Android

**Implementation:**
```typescript
import * as Sharing from 'expo-sharing';
import * as Linking from 'expo-linking';

const shareCourt = async (court: Court) => {
  const url = Linking.createURL(`/court/${court.id}`);
  const message = `Check out ${court.name} on Pickup!\n${court.address}\n\n${url}`;

  await Sharing.shareAsync(message);
};
```

**Deep Link Configuration:**
```json
// app.json
{
  "expo": {
    "scheme": "pickup",
    "web": {
      "bundler": "metro"
    }
  }
}
```

**New Files:**
- `src/utils/sharing.ts`

**Files to Modify:**
- `app/court/[id].tsx`
- `app.json` (add scheme)

---

### F9: Onboarding Flow

**Priority:** P2 (Nice to Have)

**User Story:**
As a new user, I want to understand what the app does so I can use it effectively.

**Acceptance Criteria:**
- [ ] Shows on first launch only
- [ ] 3 screens: Welcome, Location, Features
- [ ] Skip button on each screen
- [ ] "Get Started" button on final screen
- [ ] Never shows again after completion

**Implementation Notes:**
- Use AsyncStorage flag: `onboarding_completed`
- Simple swipeable carousel
- Conditionally render in `app/_layout.tsx`

**New Files:**
- `app/onboarding.tsx`
- `src/components/OnboardingCarousel.tsx`

---

### F10: Map View

**Priority:** P2 (Nice to Have)

**User Story:**
As a user, I want to see courts on a map so I can visualize their locations.

**Acceptance Criteria:**
- [x] Map tab shows all nearby courts as pins
- [x] Tap pin to see court name
- [x] Tap court card to navigate to detail
- [ ] Show check-in count on pins (badge)
- [x] Recenter button to return to user location
- [x] Refresh button to reload courts

**Implementation Notes:**
- Already implemented at `app/(tabs)/map.tsx`
- Move from `/maps-test` to main tab bar
- Add check-in count badges to pins

**Files to Modify:**
- `app/(tabs)/map.tsx` (add check-in badges)
- `src/components/Map/CourtsMap.tsx`

---

## Data Models

### Court

```typescript
interface Court {
  // Identity
  id: string;
  name: string;
  description: string | null;

  // Location
  latitude: number;
  longitude: number;
  location: any | null; // PostGIS geography
  address: string | null;
  city: string | null;
  state: string | null;
  postal_code: string | null;
  country: string;
  timezone: string;

  // Court details
  indoor: boolean | null;
  surface_type: string | null; // 'asphalt', 'concrete', 'hardwood', 'rubber'
  num_hoops: number | null;
  lighting: boolean | null;

  // Hours
  open_24h: boolean;
  hours_json: any | null; // { open: "06:00", close: "22:00" }

  // Metadata
  amenities_json: string[] | null; // ['lights', 'parking', 'restrooms', 'water']
  photos_count: number;
  photo_url: string | null; // Supabase storage URL

  // Source
  osm_type: string | null; // 'node', 'way', 'relation'
  osm_id: number | null;

  // Timestamps
  created_at: string;
  updated_at: string;

  // Computed (from query)
  distance_meters?: number;
  check_ins_count?: number;
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

interface CheckInWithCourt extends CheckIn {
  court: Court;
}
```

### Supabase RPC Functions

```sql
-- Get court by ID
create or replace function court_by_id(court_id text)
returns setof courts
language sql
as $$
  select * from courts where id = court_id limit 1;
$$;

-- Get nearby courts with distance
create or replace function courts_nearby(
  lat double precision,
  lon double precision,
  radius_meters integer,
  limit_count integer default 100
)
returns table (
  id text,
  name text,
  description text,
  latitude double precision,
  longitude double precision,
  address text,
  city text,
  state text,
  postal_code text,
  country text,
  timezone text,
  indoor boolean,
  surface_type text,
  num_hoops integer,
  lighting boolean,
  open_24h boolean,
  hours_json jsonb,
  amenities_json jsonb,
  photos_count integer,
  photo_url text,
  created_at timestamp with time zone,
  updated_at timestamp with time zone,
  distance_meters double precision
)
language sql
as $$
  select
    id,
    name,
    description,
    latitude,
    longitude,
    address,
    city,
    state,
    postal_code,
    country,
    timezone,
    indoor,
    surface_type,
    num_hoops,
    lighting,
    open_24h,
    hours_json,
    amenities_json,
    photos_count,
    photo_url,
    created_at,
    updated_at,
    ST_Distance(
      location::geography,
      ST_SetSRID(ST_MakePoint(lon, lat), 4326)::geography
    ) as distance_meters
  from courts
  where ST_DWithin(
    location::geography,
    ST_SetSRID(ST_MakePoint(lon, lat), 4326)::geography,
    radius_meters
  )
  order by distance_meters
  limit limit_count;
$$;

-- Get active check-ins for a court
create or replace function get_active_checkins(p_court_id text)
returns setof check_ins
language sql
as $$
  select * from check_ins
  where court_id = p_court_id
    and expires_at > now()
  order by created_at desc;
$$;
```

---

## UI/UX Guidelines

### Design System

**Colors:**
- Background: `#000000` (black)
- Text Primary: `#FFFFFF` (white)
- Text Secondary: `rgba(255, 255, 255, 0.7)`
- Text Tertiary: `rgba(255, 255, 255, 0.5)`
- Text Quaternary: `rgba(255, 255, 255, 0.4)`
- Borders: `rgba(255, 255, 255, 0.1)`
- Card Background: `rgba(255, 255, 255, 0.05)`

**Typography:**
- Headings: Bold, 2xl-3xl
- Body: Regular, base
- Meta: Regular, sm-xs, low opacity

**Spacing:**
- Screen padding: `px-6 py-6`
- Card padding: `p-4`
- Gaps: `gap-3` or `mt-3`

**Components:**
- Rounded corners: `rounded-2xl`
- Cards: `border border-white/10 bg-white/5 p-4 rounded-2xl`
- Buttons: Primary (white bg) or Secondary (white/10 border)

### Interaction Patterns

**Loading States:**
- Use skeleton loaders (animated gray bars)
- Never show blank screens
- Always provide feedback

**Error States:**
- User-friendly messages (not technical errors)
- Provide retry actions
- Never crash silently

**Empty States:**
- Explain why empty ("No courts found near you")
- Provide action ("Try increasing radius" or "Add a court")
- Never just show empty list

**Haptic Feedback:**
- Save/unsave: Medium impact
- Check-in: Medium impact
- Errors: Notification feedback
- Success: Success feedback

### Accessibility

- All tappable areas minimum 44pt
- Sufficient color contrast
- Support for larger text sizes
- Descriptive labels for screen readers

---

## API Integration

### Supabase Setup

**Environment Variables:**
```env
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

**Client Configuration:**
```typescript
import { createClient } from '@supabase/supabase-js';

export const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL!,
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!,
  {
    auth: {
      persistSession: false, // No auth for MVP
    },
  }
);
```

### Realtime Subscriptions

**Check-ins:**
```typescript
const subscription = supabase
  .channel(`court:${courtId}`)
  .on(
    'postgres_changes',
    {
      event: '*',
      schema: 'public',
      table: 'check_ins',
      filter: `court_id=eq.${courtId}`,
    },
    (payload) => {
      // Handle insert/delete
      handleCheckInChange(payload);
    }
  )
  .subscribe();

// Cleanup
return () => {
  subscription.unsubscribe();
};
```

### Error Handling

- Always have fallback to mock data
- Log errors in development only
- Show user-friendly messages
- Retry transient failures automatically

---

## Testing Requirements

### Manual Testing Checklist

**Before Each Commit:**
- [ ] App builds without errors
- [ ] No TypeScript errors
- [ ] No console errors
- [ ] Test on iOS simulator
- [ ] Test on Android emulator (if applicable)

**Before Each Feature PR:**
- [ ] Feature works on iOS
- [ ] Feature works on Android
- [ ] Works with mock data (Supabase disabled)
- [ ] Works with live data (Supabase enabled)
- [ ] Loading states display correctly
- [ ] Error states display correctly
- [ ] Empty states display correctly

**Before Launch:**
- [ ] Test on physical iOS device
- [ ] Test on physical Android device
- [ ] Test location permission denied
- [ ] Test network offline
- [ ] Test app backgrounding/foregrounding
- [ ] Test deep links
- [ ] Performance audit (no memory leaks)
- [ ] Remove all console.logs

### Edge Cases to Test

1. **Location:**
   - Permission denied
   - Location unavailable
   - Location takes long time

2. **Network:**
   - Offline mode
   - Slow connection
   - Request timeout
   - Supabase down

3. **Data:**
   - No courts nearby
   - Court missing data (null fields)
   - Invalid coordinates
   - Check-in expiration

---

## Development Guidelines

### Code Style

**File Naming:**
- Components: PascalCase (`CourtCard.tsx`)
- Services: camelCase (`courts.ts`)
- Utils: camelCase (`directions.ts`)

**Component Structure:**
```typescript
// 1. Imports
import React, { useState, useEffect } from 'react';
import { View } from 'react-native';

// 2. Types
interface Props {
  courtId: string;
}

// 3. Component
export default function CourtDetail({ courtId }: Props) {
  // 3a. State
  const [court, setCourt] = useState<Court | null>(null);

  // 3b. Effects
  useEffect(() => {
    loadCourt();
  }, [courtId]);

  // 3c. Handlers
  const loadCourt = async () => {
    // ...
  };

  // 3d. Render
  return (
    <View>
      {/* ... */}
    </View>
  );
}
```

**TypeScript:**
- Explicit types for all function parameters
- Explicit return types for functions
- No `any` types (use `unknown` if necessary)
- Interface for objects, type for unions/primitives

**Comments:**
- Explain "why", not "what"
- Document complex business logic
- No obvious comments

### Git Workflow

**Branch Strategy:**
```
main            # Production-ready code
├── mvp-launch  # MVP development branch
    ├── feature/directions
    ├── feature/check-ins
    └── feature/filters
```

**Commit Messages:**
```
feat: add get directions button to court detail
fix: correct hours formatting for 12-hour time
chore: remove debug UI from courts list
docs: update product spec with check-in schema
```

**Before Committing:**
```bash
# Lint
npm run lint

# Type check
npx tsc --noEmit

# Build test
npm run ios  # or android
```

### Performance Considerations

**Optimization Rules:**
- Use `useMemo` for expensive computations
- Use `useCallback` for functions passed to children
- Lazy load images with `expo-image`
- Debounce search/filter inputs
- Paginate long lists (>100 items)
- Compress images before upload

**Bundle Size:**
- Avoid large dependencies
- Use tree-shaking
- Remove unused imports
- No lodash (use native JS)

---

## Implementation Priority

### Phase 1: Core MVP (Week 1-2)
1. ✅ Get Directions integration (COMPLETED)
2. ✅ Check-in feature with realtime (COMPLETED)
3. ⬜ Remove all debug UI
4. ⬜ Fix Profile tab duplicates
5. ⬜ Format hours properly
6. ⬜ Add haptic feedback

### Phase 2: Enhancement (Week 3)
7. ⬜ Court photos
8. ⬜ Share & deep linking
9. ⬜ Filters & search
10. ⬜ Onboarding flow

### Phase 3: Post-Launch (Week 4+)
11. ⬜ User feedback integration
12. ⬜ Analytics tracking
13. ⬜ Performance optimization
14. ⬜ Bug fixes from beta testing

---

## Definition of Done

A feature is considered "done" when:
- [ ] Code implemented and tested
- [ ] Works on iOS and Android
- [ ] Handles loading/error/empty states
- [ ] TypeScript types defined
- [ ] No console errors or warnings
- [ ] Committed with descriptive message
- [ ] Tested on physical device
- [ ] Documented in spec (if applicable)

---

## Questions & Decisions Log

### Decided
1. **Q:** Should we require user accounts?
   **A:** No, anonymous for MVP. Check-ins use device ID.

2. **Q:** How long should check-ins last?
   **A:** 3 hours (typical game length).

3. **Q:** Should we support multiple photos per court?
   **A:** No, 1 photo for MVP to reduce complexity.

4. **Q:** Web support?
   **A:** No, mobile-only for MVP.

### Open Questions
1. How do we handle spam/fake check-ins? (Post-MVP: rate limiting)
2. Should check-ins be visible on map pins? (Nice to have)
3. What analytics events should we track? (TBD)

---

## References

- **MVP Launch Plan:** See `MVP_Launch_Plan.md` for timeline and budget
- **Supabase Docs:** https://supabase.com/docs
- **Expo Docs:** https://docs.expo.dev
- **NativeWind Docs:** https://www.nativewind.dev

---

**For Claude Code Developer:**

When implementing features:
1. Read this spec for requirements
2. Check existing code in `src/services/` and `app/`
3. Follow code style guidelines
4. Test on both iOS and Android
5. Update this spec if requirements change
6. Ask user for clarification on ambiguous requirements

This is a living document. Update it as the product evolves.
