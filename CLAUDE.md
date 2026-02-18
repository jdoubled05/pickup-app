# Claude Code Instructions - Pickup Basketball App

> These are durable instructions for Claude Code when working on this project.

## Project Context

This is **Pickup**, a React Native mobile app (iOS/Android) built with Expo that helps basketball players find active pickup games at nearby courts through real-time check-ins and location-based discovery.

**Current Phase:** MVP Development
**Target Launch:** 3 weeks from start
**Status:** Core features implemented, polish and new features in progress

## Primary References

1. **PRODUCT_SPEC.md** - Complete feature specifications, data models, architecture
2. **MVP_Launch_Plan.md** - Timeline, budget, launch checklist
3. This file (CLAUDE.md) - Your working instructions

## Tech Stack Quick Reference

- **React Native:** 0.81.5 with TypeScript 5.9.2
- **Navigation:** Expo Router (file-based)
- **Styling:** NativeWind (Tailwind for RN)
- **Backend:** Supabase (PostgreSQL + Realtime + Storage)
- **Maps:** MapLibre React Native
- **State:** React hooks (no Redux/MobX)

## Development Rules

### When Implementing Features

1. **Always check PRODUCT_SPEC.md first** for:
   - Acceptance criteria
   - Implementation notes
   - Database schemas
   - Files to modify

2. **Follow existing patterns:**
   - Services in `src/services/` for all API/business logic
   - Components in `src/components/` for reusable UI
   - Types in `src/types/` for TypeScript definitions
   - Screens in `app/` using Expo Router conventions

3. **Code Style:**
   - TypeScript: Explicit types on all params and returns
   - No `any` types (use `unknown` if needed)
   - Components: Import → Types → Component → Exports
   - Use `useMemo` for expensive computations
   - Use `useCallback` for child function props

4. **UI Consistency:**
   - Black background: `bg-black`
   - White text with opacity: `text-white/70`
   - Cards: `rounded-2xl border border-white/10 bg-white/5 p-4`
   - Screen padding: `px-6 py-6`
   - Use existing UI components from `src/components/ui/`

### Testing Requirements

Before marking any task complete:
- [ ] No TypeScript errors
- [ ] No console errors/warnings
- [ ] Works with Supabase enabled
- [ ] Works with Supabase disabled (mock data)
- [ ] Loading states implemented
- [ ] Error states handled gracefully
- [ ] Test on iOS simulator minimum

### What NOT to Do

❌ Don't add user authentication (explicitly out of scope for MVP)
❌ Don't add complex state management (Redux, MobX, etc.)
❌ Don't add features not in PRODUCT_SPEC.md without asking
❌ Don't leave debug UI or console.logs in production code
❌ Don't use `any` types
❌ Don't import entire libraries (e.g., don't use lodash)
❌ Don't add dependencies without discussing first

### Supabase Integration

**When feature needs backend:**

1. Check if RPC function exists in PRODUCT_SPEC.md
2. Create service file in `src/services/`
3. Add TypeScript types in `src/types/`
4. Always handle errors gracefully
5. Always provide fallback to mock data

**Environment:**
- Supabase credentials in `.env` (EXPO_PUBLIC_SUPABASE_URL, EXPO_PUBLIC_SUPABASE_ANON_KEY)
- Use `getSupabaseEnvStatus()` to check if configured
- Fall back to mock data if not configured

### File Organization

```
When creating new features:

1. Types: src/types/feature-name.ts
2. Service: src/services/feature-name.ts
3. Component (if reusable): src/components/FeatureName.tsx
4. Screen: app/feature-name.tsx or app/(tabs)/feature-name.tsx
```

### Git Commits

When you implement features, use conventional commits:

```
feat: add get directions button
fix: correct hours formatting
chore: remove debug UI
docs: update spec
```

Don't create commits yourself unless explicitly asked.

## Current MVP Priorities

### ✅ Completed
- Court listing with location-based discovery
- Court detail pages
- Save/unsave courts (local storage)
- Map view with pins
- Mock data + Supabase integration

### 🚧 In Progress (Week 1-2)
Priority order for MVP:

1. **Get Directions** - Add button on court detail that opens Maps app
2. **Check-ins Feature** - Real-time "I'm Here" with Supabase
3. **Remove Debug UI** - Clean up all "Mock data", status indicators
4. **Fix Profile Tab** - Remove duplicate sections (lines 37-48)
5. **Format Hours** - Convert JSON to readable format
6. **Haptic Feedback** - Add to save/unsave actions

### ⏳ Upcoming (Week 3)
7. Court photos (upload + display)
8. Share & deep linking
9. Filters & search
10. Onboarding flow

## Quick Commands Reference

```bash
# Start dev server
npx expo start

# Run on iOS
npx expo run:ios

# Run on Android
npx expo run:android

# Type check
npx tsc --noEmit

# Lint
npm run lint

# Install new dependency (ask first!)
npx expo install package-name
```

## Common Patterns in This Codebase

### Loading Data from Supabase

```typescript
const [data, setData] = useState<Type[]>([]);
const [loading, setLoading] = useState(true);
const [error, setError] = useState<string | null>(null);

const loadData = useCallback(async () => {
  setLoading(true);
  setError(null);
  try {
    const result = await serviceFunction();
    setData(result);
  } catch (err) {
    setError(err instanceof Error ? err.message : 'Failed to load');
  } finally {
    setLoading(false);
  }
}, []);

useEffect(() => {
  loadData();
}, [loadData]);
```

### Supabase Realtime Subscription

```typescript
useEffect(() => {
  const channel = supabase
    .channel('channel-name')
    .on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'table_name',
      filter: 'column=eq.value'
    }, (payload) => {
      // Handle change
    })
    .subscribe();

  return () => {
    channel.unsubscribe();
  };
}, [dependency]);
```

### NativeWind Styling

```typescript
// Good
<View className="flex-1 bg-black px-6 py-6">
  <Text className="text-2xl font-bold">Title</Text>
  <Text className="mt-2 text-white/70">Subtitle</Text>
</View>

// Don't use StyleSheet.create - use NativeWind classes
```

## When User Asks You To...

**"Add a feature"**
1. Check PRODUCT_SPEC.md for requirements
2. Ask clarifying questions if ambiguous
3. Propose implementation approach
4. Show what files you'll modify
5. Implement with proper error handling

**"Fix a bug"**
1. Reproduce the issue
2. Identify root cause
3. Propose fix
4. Implement with tests
5. Verify fix works

**"Clean up code"**
1. Remove debug UI (console.logs, status indicators)
2. Fix TypeScript errors
3. Improve error handling
4. Add loading states if missing
5. Format code consistently

## Asking User Questions

If you need clarification on:
- **Feature requirements:** Check spec first, then ask
- **Design decisions:** Refer to UI guidelines in spec
- **Technical approach:** Propose 2-3 options with tradeoffs
- **Priorities:** Refer to MVP_Launch_Plan.md phases

## Database Schema Reference

See PRODUCT_SPEC.md for full schemas, but key tables:

**courts** - Basketball court locations and details
**check_ins** - Real-time user check-ins (expires after 3h)

Saved courts are LOCAL ONLY (AsyncStorage, no backend).

## Performance Guidelines

- Images: Use `expo-image` component, compress before upload
- Lists: Use `FlatList` for >20 items
- Expensive computations: Wrap in `useMemo`
- Function props: Wrap in `useCallback`
- Don't fetch data unnecessarily (cache when possible)

## Remember

- **MVP mindset:** Ship simple, iterate based on feedback
- **Mobile-first:** Test on simulators/devices, not just web
- **Offline-capable:** Always handle network failures gracefully
- **Anonymous users:** No auth, use device ID for check-ins
- **Real-time is key:** Check-ins are the differentiator

## Help the User

You're not just writing code - you're helping ship an MVP. That means:
- Suggest simplifications when scope creeps
- Flag potential issues early
- Recommend phasing features if needed
- Keep the 3-week timeline in mind
- Prioritize P0/P1 features from spec

---

When in doubt:
1. Check PRODUCT_SPEC.md
2. Look at existing code patterns
3. Ask the user
4. Default to simplest solution that works

Good luck! Let's ship this MVP. 🏀
