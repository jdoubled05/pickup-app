# Scripts

This directory contains utility scripts for managing court data.

## Available Scripts

### 1. `import-osm-courts.ts`

Imports basketball courts from OpenStreetMap for any city.

**Usage:**
```bash
# List available cities
npm run import-courts

# Import a preset city
npm run import-courts -- --city="los angeles"

# Replace all existing courts
npm run import-courts -- --city="atlanta" --replace

# Custom city with bounding box
npm run import-courts -- --city="Seattle" --bbox="-122.44,47.48,-122.24,47.73"
```

**What it does:**
- Queries OpenStreetMap Overpass API
- Transforms OSM data to court schema
- Batch inserts to Supabase
- Handles deduplication via upsert

**Preset Cities:**
- Atlanta, Los Angeles, New York, Chicago
- Houston, Phoenix, Philadelphia, San Antonio
- San Diego, Dallas

---

### 2. `review-courts.ts`

Admin tool to review user-submitted courts.

**Usage:**
```bash
# List all pending submissions
npm run review-courts

# Approve a court
npm run review-courts -- approve <court-id>

# Reject a court
npm run review-courts -- reject <court-id> "reason"
```

**What it does:**
- Lists pending submissions from `pending_courts` table
- Approves courts by moving them to `courts` table
- Rejects courts with a reason
- Shows Google Maps links for verification

---

## Prerequisites

1. **Environment Variables:**
   ```
   EXPO_PUBLIC_SUPABASE_URL=your_url
   EXPO_PUBLIC_SUPABASE_ANON_KEY=your_key
   ```

2. **Dependencies:**
   ```bash
   npm install
   ```
   This installs `tsx` for running TypeScript directly.

3. **Database Migration:**
   Run `006_create_pending_courts.sql` before using review-courts.

---

## Examples

### Launch in Los Angeles

```bash
# Import 800+ courts from OpenStreetMap
npm run import-courts -- --city="los angeles"

# Open app and verify courts appear
# Enable user submissions via app

# Review submissions daily
npm run review-courts
```

### Expand to Multiple Cities

```bash
# Import 3 cities in parallel (run in separate terminals)
npm run import-courts -- --city="new york"
npm run import-courts -- --city="chicago"
npm run import-courts -- --city="houston"

# Or sequentially
npm run import-courts -- --city="new york" && \
npm run import-courts -- --city="chicago" && \
npm run import-courts -- --city="houston"
```

---

## Troubleshooting

**Script not found:**
```bash
npm install  # Make sure tsx is installed
```

**No courts found:**
- Check bounding box is correct
- Verify OSM has courts in that area
- Try a larger area

**Permission errors:**
- Check Supabase credentials in `.env`
- Verify RLS policies allow inserts

---

## Future Scripts

Planned additions:
- `export-courts.ts` - Export courts to CSV
- `dedupe-courts.ts` - Find and merge duplicates
- `geocode-courts.ts` - Add missing addresses via Google Maps API
- `import-csv.ts` - Import from custom CSV files

---

See [COURT_DATA_GUIDE.md](../COURT_DATA_GUIDE.md) for comprehensive documentation.
