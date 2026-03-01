# Court Submission Review Guide

Quick reference for approving or rejecting user-submitted courts.

---

## One-Time Setup

**1. Get your Supabase service role key**
- Go to [Supabase Dashboard](https://supabase.com/dashboard) → Your Project → Settings → API
- Copy the `service_role` secret key (not the anon key)

**2. Add it to your `.env` file**
```
SUPABASE_SECRET_KEY=your_service_role_key_here
```

**3. Ensure the DB migration has been run**
- Run `006_create_pending_courts.sql` in Supabase SQL Editor if not done already

---

## Daily Review Workflow

### Step 1 — List pending submissions
```bash
npm run review-courts
```
Each submission shows:
- Name, address, GPS coordinates
- Court attributes (indoor, hoops, lighting, surface)
- Submitter notes
- **Google Maps link** — click to verify the location

### Step 2 — Check photos (if any)
Go to **Supabase Dashboard → Storage → court-photos → pending-courts/{submission-id}/**
Photos submitted with the court will be here.

### Step 3 — Approve or reject

```bash
# Approve — court goes live in the app immediately
npm run review-courts -- approve <id>

# Reject with a reason
npm run review-courts -- reject <id> "reason here"
```

**Common rejection reasons:**
- `"Duplicate of existing court"`
- `"Could not verify location from coordinates"`
- `"Not a basketball court"`
- `"Insufficient information provided"`

---

## What Happens on Approval

The script automatically:
1. Inserts a new row into the live `courts` table
2. Marks the `pending_courts` record as `approved`
3. Court becomes visible in the app instantly

What it does **not** do (manual for now):
- Move photos from `pending-courts/` to `courts/` in storage
- Notify the submitter

---

## Getting Notified of New Submissions

No automatic alerts yet. Options:

**Option A — Supabase webhook (recommended)**
- Dashboard → Database → Webhooks → Create new webhook
- Table: `pending_courts`, Event: `INSERT`
- Endpoint: any email-to-webhook service (e.g., Make, Zapier)

**Option B — Manual check**
- Run `npm run review-courts` once a day
- Takes ~30 seconds to review a batch

---

## Known Limitations

| Issue | Workaround |
|---|---|
| Timezone defaults to `America/New_York` on approval | Manually update in Supabase if needed |
| Photos not moved on approval | They're still visible in Storage under `pending-courts/` |
| No submitter notification | Planned post-MVP |

---

## Supabase Quick Links

- **Pending courts table:** Dashboard → Table Editor → `pending_courts`
- **Submission photos:** Dashboard → Storage → `court-photos` → `pending-courts/`
- **Live courts:** Dashboard → Table Editor → `courts`
