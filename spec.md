Those **terminate the outer code block early**, which is why part of the file turns into regular text.

### ✅ Fix

The solution is to **remove all inner fenced code blocks** and replace them with **indented or inline command text** so the entire file stays inside **one single Markdown fence**.

Below is the **corrected `spec.md`**.  
It is **guaranteed safe to copy** because:

- There is **exactly one opening ```**
- There is **exactly one closing ```**
- No nested fences anywhere inside

---

```md
# Pickup App – Product & Technical Specification

## 1. Overview

**Pickup** is a mobile application designed to help basketball players discover, explore, and organize pickup basketball games and courts. The app focuses on court discovery, real-world accuracy, and community trust.

Primary goals:

- Help users find nearby basketball courts quickly
- Provide accurate, up-to-date court information
- Enable lightweight social coordination around pickup games
- Remain fast, stable, and scalable on mobile devices

Target platforms:

- iOS (primary)
- Android (secondary)

---

## 2. Tech Stack

### Frontend

- Framework: Expo (Managed-first workflow)
- Routing: Expo Router
- Language: TypeScript
- Styling: NativeWind (Tailwind CSS for React Native)
- UI Philosophy: Minimal primitives + composable styles
- Architecture: Legacy React Native (New Architecture planned later)

### Native / Device

- Dev Client: expo-dev-client
- Maps: MapLibre GL (to be integrated after shell stabilization)
- Safe Area: react-native-safe-area-context

### Backend

- Backend-as-a-Service: Supabase
- Database: PostgreSQL (PostGIS enabled)
- Auth: Supabase Auth
- Storage: Supabase Storage (court photos)
- APIs: Supabase RPC + REST

### Tooling

- Node.js: 20.x (LTS)
- Package Manager: npm
- Builds:
  - Local simulator builds via expo run:ios
  - Device builds via EAS (development profile only when native deps change)
- Version Control: Git

---

## 3. App Structure (Expo Router)

app/

- \_layout.tsx Root app shell (Stack)
- index.tsx Home screen
- maps-test.tsx MapLibre testing screen
- courts/
  - [id].tsx Court detail screen

Supporting folders:

src/

- components/
  - AppShell.tsx
  - ui/
    - Button.tsx
    - Text.tsx
- lib/
  - cn.ts className helper
  - theme.ts brand tokens
- services/
  - supabase.ts Supabase client

---

## 4. Navigation Model

- Root navigation uses an Expo Router Stack
- No tabs initially (keeps routing simple and stable)
- Future expansion may introduce tabs:
  - Home
  - Courts
  - Map
  - Profile

---

## 5. Core Features

### 5.1 Home Screen

Purpose:

- Entry point to the app
- Surface key actions

Responsibilities:

- Introduce the app
- Provide navigation to court discovery and map view

---

### 5.2 Court Discovery

Court Entity fields:

- id
- name
- latitude
- longitude
- address
- court_type (indoor / outdoor)
- surface_type
- number_of_hoops
- lighting (boolean)
- open_hours
- last_verified_at
- created_at

Stored in Supabase with PostGIS geometry.

---

### 5.3 Court Detail Screen (/courts/[id])

Purpose:

- Show detailed information for a single court

Features:

- Court metadata
- Map preview (MapLibre)
- Photos
- Notes / description
- Verification status

---

### 5.4 Map View (maps-test.tsx)

Purpose:

- Explore courts visually

Planned features:

- MapLibre map
- User location
- Court markers
- Marker clustering
- Tap marker to open court detail

This screen is intentionally isolated during early development to prevent Metro/native instability.

---

## 6. Styling System (NativeWind)

Philosophy:

- Pure Tailwind utility classes
- Minimal abstractions
- Small reusable primitives

Brand Tokens (defined in src/lib/theme.ts):

- Brand red: #960000
- Black: #000000
- White: #FFFFFF

UI Primitives:

- Text
- Button
- Future: Card, Badge, Divider

---

## 7. Supabase Integration

Auth:

- Email / password
- Future OAuth providers (Google, Apple)

Database:

- PostgreSQL with PostGIS
- Row-level security enabled

Storage:

- Court photos
- User avatars (future)

Access Pattern:

- Client-side reads for public data
- Authenticated writes
- Validation via RLS and RPC

---

## 8. Performance & Stability Principles

- Avoid custom Metro configs unless absolutely required
- Avoid heavy compile-time UI frameworks
- Rebuild native code only when native dependencies change
- Simulator-first development
- Small, incremental feature commits

---

## 9. Build & Development Workflow

Simulator (Unlimited):

- expo prebuild --clean
- expo run:ios
- expo start --dev-client

Physical Device (Quota-limited):

- Use EAS dev builds only when native modules change
- Delete old dev builds before installing new ones

---

## 10. Roadmap

Phase 1 – Stable Core (Current):

- App shell
- Routing
- NativeWind UI
- Simulator + device stability

Phase 2 – Data + Maps:

- Supabase integration
- Court list
- MapLibre integration

Phase 3 – Community Features:

- Court verification
- Ratings
- Pickup game coordination

Phase 4 – Monetization:

- Premium features
- Sponsored courts
- Advanced filtering

---

## 11. Non-Goals (for now)

- Real-time chat
- Social feeds
- Complex animation systems
- Desktop/web parity

---

## 12. Guiding Principle

Stability beats cleverness.  
Every dependency, abstraction, and feature must justify its complexity.
```
