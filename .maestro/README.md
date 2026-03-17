# Maestro E2E Tests

## Setup

```bash
brew install maestro
maestro --version
```

## Running Tests

```bash
# Run all flows
maestro test .maestro/

# Run a single flow
maestro test .maestro/01_courts_list.yaml

# Run by tag
maestro test --tag smoke .maestro/

# Run on specific simulator
maestro test --device <device-id> .maestro/01_courts_list.yaml

# List available devices
maestro device
```

## Flow Index

| File | Tags | What it tests |
|------|------|---------------|
| `00_onboarding.yaml` | onboarding | First-launch carousel + Get Started |
| `01_courts_list.yaml` | courts, smoke | List load, scroll, search, navigate to detail |
| `02_court_detail.yaml` | courts, checkin, smoke | Save, check in/out, directions button |
| `03_filters.yaml` | filters, smoke | Apply indoor filter, reset |
| `04_saved_courts.yaml` | saved | Save court, view in profile, unsave |
| `05_map.yaml` | map, smoke | Search city, recenter, refresh |
| `06_map_filters.yaml` | map, filters | Apply active-only filter from map |

## Before Running

- App must be running on simulator (`npx expo run:ios` or via Expo Go)
- Supabase must be configured (`.env.local` present) for live data tests
- For `00_onboarding.yaml`, `clearState` wipes the app's AsyncStorage

## Tips

- `waitForAnimationToEnd` is essential after navigation and map interactions
- Text selectors are case-insensitive by default in Maestro
- If a flow fails on text it can't find, use `maestro studio` to inspect the UI tree
- Flows are independent — each launches fresh (except `clearState` in onboarding)

## Debugging

```bash
# Interactive studio to inspect UI and build flows
maestro studio

# View last test report
maestro test --format junit .maestro/ --output report.xml
```
