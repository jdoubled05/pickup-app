# Phase 2 Implementation Plan (Data + Maps)

## Milestone 1: Supabase foundation
Goal: Add a Supabase client scaffold with env validation and a mock-first courts data layer.
Files to touch: src/services/supabase.ts, src/services/courts.ts, package.json (dependency)
Acceptance criteria: Supabase client initializes from env vars; dev throws a clear error when misconfigured; courts service returns mock data by default.
Rollback plan: Revert the commit to remove the Supabase client and courts service.
Suggested commit message: feat: add supabase client scaffold

## Milestone 2: Courts list
Goal: Add a courts list route that renders mocked data and links to details.
Files to touch: app/courts/index.tsx, app/index.tsx
Acceptance criteria: /courts renders a list; each item navigates to /courts/[id]; home links to /courts.
Rollback plan: Revert the commit to restore prior home screen and remove /courts index route.
Suggested commit message: feat: add courts list route and home link

## Milestone 3: Court detail data
Goal: Load court data via the courts service and render real fields.
Files to touch: app/courts/[id].tsx
Acceptance criteria: /courts/[id] shows name, address, and metadata with loading state; handles missing data safely.
Rollback plan: Revert the commit to return to static screen content.
Suggested commit message: feat: load court detail data via courts service

## Milestone 4: MapLibre reintroduction
Goal: Reintroduce MapLibre in maps-test with guarded feature flags and stable defaults.
Files to touch: app/maps-test.tsx, src/components/MapView.tsx (new), app/_layout.tsx (if provider is needed)
Acceptance criteria: MapLibre renders on iOS simulator without crashing; navigation to /maps-test works; map can be removed cleanly.
Rollback plan: Remove map component import and revert maps-test to static scaffold.
Suggested commit message: feat: reintroduce MapLibre map scaffold
