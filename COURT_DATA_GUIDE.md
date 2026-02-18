# Court Data Management Guide

This guide covers how to expand and manage the courts database using both automated imports and user submissions.

---

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

This will install `tsx` (TypeScript execution) needed to run the import scripts.

### 2. Run the Migration

Apply the database migration to create the `pending_courts` table:

```bash
# Using Supabase CLI (if installed)
supabase db push

# Or manually run the migration in Supabase dashboard:
# 1. Go to SQL Editor
# 2. Paste contents of supabase/migrations/006_create_pending_courts.sql
# 3. Run
```

---

## Automated Import (OSM)

### Import Courts from OpenStreetMap

The fastest way to add hundreds of courts to a new city.

#### Available Cities (Pre-configured)

```bash
# Atlanta (already loaded)
npm run import-courts -- --city="atlanta"

# Los Angeles
npm run import-courts -- --city="los angeles"

# New York
npm run import-courts -- --city="new york"

# Chicago
npm run import-courts -- --city="chicago"

# Houston
npm run import-courts -- --city="houston"

# Phoenix
npm run import-courts -- --city="phoenix"

# Philadelphia
npm run import-courts -- --city="philadelphia"

# San Antonio
npm run import-courts -- --city="san antonio"

# San Diego
npm run import-courts -- --city="san diego"

# Dallas
npm run import-courts -- --city="dallas"
```

#### Replace Existing Data

To delete all existing courts and import fresh data:

```bash
npm run import-courts -- --city="los angeles" --replace
```

⚠️ **Warning:** `--replace` will delete ALL courts in the database before importing.

#### Custom City (Advanced)

For cities not in the preset list, find a bounding box at [bboxfinder.com](http://bboxfinder.com/) and use:

```bash
npm run import-courts -- --city="Seattle" --bbox="-122.44,47.48,-122.24,47.73"
```

#### What Gets Imported

- Court name
- Coordinates (latitude/longitude)
- Address (if available in OSM)
- Indoor/outdoor status
- Surface type (asphalt, concrete, hardwood, etc.)
- Number of hoops
- Lighting (yes/no)
- Hours (if available)

#### Expected Results

| City | Estimated Courts |
|------|-----------------|
| Los Angeles | 800-1,200 |
| New York | 1,000-1,500 |
| Chicago | 600-900 |
| Houston | 400-700 |
| Atlanta | 500-700 |

---

## User Submissions

### How It Works

1. Users tap "Submit a Court" in the Profile tab
2. They fill out court details and capture GPS location
3. Submission goes to `pending_courts` table with status "pending"
4. Admin reviews and approves/rejects via CLI tool

### Review Pending Submissions

List all pending submissions:

```bash
npm run review-courts
```

Example output:
```
📋 2 Pending Court Submissions:

1. Piedmont Park Courts
   ID: 123e4567-e89b-12d3-a456-426614174000
   Address: 1071 Piedmont Ave NE
   City/State: Atlanta, GA
   Location: 33.7859, -84.3733
   Indoor: No
   Hoops: 4
   Lighting: Yes
   Surface: asphalt
   Submitted: 2/16/2026, 3:45 PM
   Google Maps: https://www.google.com/maps?q=33.7859,-84.3733
```

### Approve a Court

```bash
npm run review-courts -- approve 123e4567-e89b-12d3-a456-426614174000
```

This will:
1. Create a new court in the `courts` table
2. Mark the submission as "approved"
3. Generate a unique court ID

### Reject a Court

```bash
npm run review-courts -- reject 123e4567-e89b-12d3-a456-426614174000 "Duplicate of existing court"
```

Rejection reasons to use:
- "Duplicate of existing court"
- "Invalid location (not a basketball court)"
- "Coordinates are incorrect"
- "Court no longer exists"

---

## Data Quality Guidelines

### When to Approve

✅ **Approve if:**
- Location is accurate (verify on Google Maps)
- Court name is clear and descriptive
- It's a real basketball court
- Not a duplicate

### When to Reject

❌ **Reject if:**
- Coordinates point to wrong location
- Duplicate of existing court
- Not a basketball court (tennis, volleyball, etc.)
- Clearly spam or test submission
- Missing critical information (name, location)

### Deduplication

Before approving, check for duplicates:

1. Open Google Maps link from submission
2. Search existing courts in app at that location
3. If court already exists within ~100m, reject as duplicate

---

## Best Practices

### Initial City Launch

1. **Import OSM data first** (bulk foundation)
   ```bash
   npm run import-courts -- --city="los angeles" --replace
   ```

2. **Review data quality** in the app
   - Spot-check 10-20 courts
   - Verify coordinates are correct
   - Note any obvious errors

3. **Enable user submissions** via Profile tab
   - Let community fill gaps
   - Users submit private gyms, new courts

4. **Review submissions daily**
   ```bash
   npm run review-courts
   ```

### Ongoing Maintenance

- **Daily:** Review pending submissions (5-10 min)
- **Weekly:** Check for duplicates, merge if needed
- **Monthly:** Re-import OSM data to catch new courts

---

## Troubleshooting

### "Missing Supabase credentials"

Make sure you have a `.env` file with:
```
EXPO_PUBLIC_SUPABASE_URL=your_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_key
```

### Import returns 0 courts

- Verify bounding box coordinates are correct (west, south, east, north)
- Check if OSM has basketball courts in that area
- Try a larger bounding box

### Pending courts table doesn't exist

Run the migration:
```bash
# Copy contents of supabase/migrations/006_create_pending_courts.sql
# Paste into Supabase SQL Editor
# Run query
```

### "Permission denied" on approve/reject

The scripts now use the secret key (server-side key) which bypasses RLS policies. If you see this error:
1. Make sure `SUPABASE_SECRET_KEY` is set in your `.env` file
2. Verify you copied the correct key from Supabase Dashboard → Project Settings → API
3. The secret key should start with `eyJ...` and be very long

---

## Advanced: Batch Operations

### Approve Multiple Courts

Create a bash script:

```bash
#!/bin/bash
# approve-batch.sh

courts=(
  "123e4567-e89b-12d3-a456-426614174001"
  "123e4567-e89b-12d3-a456-426614174002"
  "123e4567-e89b-12d3-a456-426614174003"
)

for court_id in "${courts[@]}"; do
  npm run review-courts -- approve "$court_id"
  sleep 1
done
```

### Export Pending Courts to CSV

```bash
# In Supabase SQL Editor:
COPY (SELECT * FROM pending_courts WHERE status = 'pending')
TO '/tmp/pending_courts.csv'
WITH CSV HEADER;
```

---

## Community Features

### Photo Uploads ✅ Implemented

Users can now upload photos of courts directly from the court detail screen.

**How it works:**
1. Navigate to any court detail page
2. Scroll to the "Add Photo" button
3. Choose to take a photo or select from library
4. Photo is uploaded to Supabase Storage
5. Photos appear in a scrollable gallery above the upload button

**Features:**
- Users can upload photos from camera or photo library
- Photos are stored in Supabase Storage (`court-photos` bucket)
- Users can delete their own photos
- Any photo can be set as the "primary" photo for the court
- Photos display with attribution (shows "Your photo" badge)
- Progress indicator during upload
- Haptic feedback for interactions

**Storage Structure:**
- Bucket: `court-photos`
- Path: `{court_id}/{user_id}_{timestamp}.{ext}`
- Max file size: 10MB per photo
- Public read access, authenticated upload

**Database Schema:**
See `supabase/migrations/007_create_court_photos.sql` for the complete schema.

## Future Enhancements

### Planned Features

- [ ] Web admin dashboard (no CLI needed)
- [ ] Email notifications to users when approved/rejected
- [x] Photo uploads for court submissions ✅
- [ ] Photo moderation tools
- [ ] Automated duplicate detection
- [ ] Court quality ratings from community
- [ ] Integration with Google Places API for private gyms
- [ ] Bulk import from CSV files

### Contributing Court Data

If you have a CSV of courts or access to a court database API, contact the team. We can create custom import scripts for:

- Parks department data exports
- University athletics facility lists
- Private gym databases (with permission)

---

## Support

For questions or issues:
- Check the main README.md
- Review database schema in `supabase/migrations/`
- Open an issue on GitHub

---

## Summary

**For bulk city expansion:**
```bash
npm run import-courts -- --city="los angeles"
```

**For community-driven growth:**
- Users submit via Profile → "Submit a Court"
- You review daily via `npm run review-courts`

**Best practice:** Use both! OSM for quantity, user submissions for quality and coverage.
