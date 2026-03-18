# 🏀 Pickup MVP Launch Plan

> **Goal:** Launch a basketball court finder where users can discover nearby courts, see essential details, get directions, and find active pickup games.

---

## 📊 Executive Summary

| Metric | Value |
|--------|-------|
| **Timeline** | 15-18 days (3 weeks full-time) |
| **Minimum Budget** | $0-124 (app store fees only) |
| **Recommended Budget (Year 1)** | $622-970 |
| **New Dependencies** | 2 packages (both free) |
| **Core Differentiator** | Real-time check-in feature |

---

## 📋 Development Timeline

### Week 1: Core Functionality (3-4 days)

#### Day 1-2: Navigation & Filters
**Time: 12-16 hours**

- [x] Get Directions integration (Apple/Google Maps via Linking API)
- [x] Basic court filters (Indoor/Outdoor, Lighting, Hoops)
- [x] Search by name/address
- [x] Filter UI components

**Deliverable:** Users can filter courts and navigate to them

---

#### Day 3-4: Check-in Feature ⭐ (MVP Differentiator)
**Time: 16-20 hours**

- [x] "I'm Here" button on court detail page
- [x] Display active check-ins count
- [x] Auto-expire check-ins after 3 hours
- [x] Supabase schema for check-ins table
- [x] Real-time subscription for live updates
- [x] Optimistic UI updates

**Deliverable:** Users can see who's at courts right now

**Database Schema:**
```sql
create table check_ins (
  id uuid primary key default uuid_generate_v4(),
  court_id text not null references courts(id),
  created_at timestamp with time zone default now(),
  expires_at timestamp with time zone default (now() + interval '3 hours'),
  anonymous_user_id text not null
);

create index idx_check_ins_court on check_ins(court_id);
create index idx_check_ins_expires on check_ins(expires_at);
```

---

### Week 2: Polish & Data (3-4 days)

#### Day 5: UI/UX Polish
**Time: 8-10 hours**

- [x] Remove all debug UI ("Mock data", "Live data" labels)
- [x] Remove Supabase status indicators
- [x] Remove coordinate displays
- [x] Fix duplicate sections in Profile tab (lines 37-48)
- [x] Format hours properly (convert JSON to "6:00 AM - 10:00 PM")
- [x] Add haptic feedback for save/unsave actions
- [x] Better loading states (skeletons)
- [x] Improve error messages (user-friendly)
- [x] Add pull-to-refresh feedback

**Deliverable:** App looks production-ready, not a prototype

---

#### Day 6: Photo Support
**Time: 10-12 hours**

- [x] Install expo-image-picker
- [x] Court photo upload (1 photo per court for MVP)
- [x] Display photo on detail page
- [x] Supabase Storage bucket setup
- [x] Image compression before upload
- [x] Loading states for image uploads
- [x] Fallback for courts without photos

**Deliverable:** Users can see court photos

**Storage Setup:**
```sql
-- Create storage bucket
insert into storage.buckets (id, name, public)
values ('court-photos', 'court-photos', true);

-- Set up RLS policies
create policy "Court photos are publicly accessible"
on storage.objects for select
using ( bucket_id = 'court-photos' );

create policy "Anyone can upload court photos"
on storage.objects for insert
with check ( bucket_id = 'court-photos' );
```

---

#### Day 7: Better Mock Data & Empty States
**Time: 4-6 hours**

- [ ] Add 15-20 diverse mock courts
  - [ ] New York City (3-4 courts)
  - [ ] Los Angeles (3-4 courts)
  - [ ] Chicago (2-3 courts)
  - [ ] Atlanta (2-3 courts)
  - [ ] Miami (2-3 courts)
- [ ] Include variety: indoor, outdoor, different sizes, lighting
- [ ] Better empty states with "Add Court" CTAs
- [ ] Add court count to headers ("Courts (42 nearby)")
- [ ] Empty saved list better messaging

**Deliverable:** App feels populated even without Supabase

---

### Week 3: Launch Prep (2-3 days)

#### Day 8: Share & Deep Linking
**Time: 8-10 hours**

- [x] Install expo-sharing (used native RN Share API instead — no install needed)
- [x] Share court functionality (native share sheet)
- [x] Deep link configuration (court/[id]) — Expo Router handles automatically
- [x] Handle incoming deep links (cold start + pending link after onboarding)
- [x] Share includes: court name, address, app link
- [x] Test deep links on iOS/Android (Maestro 07_share flow passing)

**Deliverable:** Users can share courts with friends

**Deep Link Format:**
```
pickupapp://court/123
https://pickup.app/court/123 (universal link)
```

---

#### Day 9: Onboarding
**Time: 6-8 hours**

- [x] Detect first launch (AsyncStorage flag)
- [x] Welcome screen with value prop
- [x] Location permission explanation (before requesting)
- [x] Quick 3-step feature tour
- [x] Skip button for impatient users
- [x] Don't show again on subsequent launches

**Deliverable:** New users understand the app

**Onboarding Flow:**
1. Welcome → "Find pickup games near you"
2. Location → "We need your location to show nearby courts"
3. Features → "Check in when you arrive, save favorites"

---

#### Day 10: Testing & Bug Fixes
**Time: 8-10 hours**

- [x] End-to-end testing on iOS simulator (8/8 Maestro flows passing)
- [ ] End-to-end testing on Android emulator
- [ ] Test on physical devices (iOS + Android)
- [ ] Location permission edge cases
- [ ] Network offline behavior
- [ ] Empty state testing
- [x] Check-in expiration works correctly
- [x] Filter combinations work
- [x] Deep links work from cold start
- [ ] Performance audit (remove console.logs)
- [ ] Memory leak check

**Deliverable:** Stable, tested app ready for TestFlight/Internal Testing

---

## 💰 Budget Breakdown

### Dependencies (Free)

| Package | Purpose | Cost | Command |
|---------|---------|------|---------|
| `expo-image-picker` | Court photo uploads | **FREE** | `npx expo install expo-image-picker` |
| `expo-sharing` | Share court feature | **FREE** | `npx expo install expo-sharing` |
| Native Linking API | Directions to court | **FREE** | Built-in to React Native |

**Total Dependencies Cost: $0**

---

### Infrastructure Costs

#### Supabase

| Tier | Price | Limits | When to Upgrade |
|------|-------|--------|-----------------|
| **Free** | **$0/month** | 500MB storage, 2GB bandwidth, 50K MAU | Start here |
| **Pro** | **$25/month** | 8GB storage, 50GB bandwidth, 100K MAU | After 1,000+ DAU |

**Recommended:** Start with free tier, upgrade when you hit limits (likely 3-6 months post-launch)

---

#### App Store Fees

| Platform | Fee Type | Cost |
|----------|----------|------|
| **Apple App Store** | Annual | **$99/year** |
| **Google Play Store** | One-time | **$25** (lifetime) |

**Total App Store Costs: $124 first year, $99/year after**

---

#### Optional Services

| Service | Tier | Monthly Cost | Annual Cost | When to Add |
|---------|------|--------------|-------------|-------------|
| **Sentry** (error tracking) | Free → Paid | $0 → $26 | $312 | Day 1 (use free) |
| **Mixpanel** (analytics) | Free → Paid | $0 → $25 | $300 | Week 2 post-launch |
| **Expo EAS Build** | Hobby → Production | $0 → $29 | $348 | If no Mac (Android builds) |

---

### Total Budget Summary

#### Minimum Launch (Month 0-6)
```
App Store fees:          $124 (one-time)
Dependencies:            $0
Supabase:                $0 (free tier)
Error tracking:          $0 (Sentry free tier)
Analytics:               $0 (Mixpanel free tier)
─────────────────────────────
TOTAL:                   $124
```

#### Recommended Year 1 (with growth)
```
App Store fees:          $124 (one-time)
Supabase (months 7-12):  $150 (6 months × $25)
EAS Build (optional):    $348 (12 months × $29)
Error tracking:          $0 (free tier sufficient)
Analytics:               $0 (free tier sufficient)
─────────────────────────────
TOTAL:                   $622-970
```

#### At Scale (1,000+ Daily Active Users)
```
App Store fees:          $99/year
Supabase Pro:            $300/year
Error tracking:          $312/year
Analytics:               $300/year
EAS Build:               $348/year
─────────────────────────────
TOTAL:                   ~$1,360/year
```

---

## 🚀 Launch Strategy

### Phase 1: Must Ship (Priority 1)
**Week 1-2 - Cannot launch without these**

- [x] Get Directions button
- [x] Check-in feature (your competitive moat)
- [x] Remove all debug UI
- [x] Fix Profile tab duplication
- [x] Better error states
- [x] Format hours properly

**Why:** These make the app actually useful and not look like a prototype

---

### Phase 2: Strong Nice-to-Haves (Priority 2)
**Week 3 - Significantly improves UX**

- [x] Photo uploads
- [x] Share/deep linking
- [x] Filters & search
- [x] Onboarding flow

**Why:** These improve retention and viral growth, but app works without them

---

### Phase 3: Post-Launch (Priority 3)
**Week 4+ - Based on user feedback**

- [ ] User accounts (anonymous → registered)
- [ ] Push notifications ("3 people checked in at your saved court")
- [ ] Court ratings/reviews
- [ ] User-submitted courts (crowdsourcing)
- [ ] Game scheduling
- [ ] Court condition reporting

**Why:** Don't build until users ask for them

---

## ⚡ Fast-Track Launch (1 Week Option)

If you need to launch in **5-7 days**, ship with ONLY:

### Must Have
- [x] Get Directions button (4 hours)
- [x] Check-in feature (16 hours)
- [x] Remove debug UI (4 hours)
- [x] Better error handling (4 hours)

### Skip for v1.0
- [ ] Photos (ship in v1.1)
- [x] Sharing (shipped in v1.0)
- [x] Filters (shipped in v1.0)
- [x] Onboarding (shipped in v1.0)

**Total time: 28-32 hours (1 week)**

This gives users **80% of the value in 40% of the time**. Launch, get feedback, iterate.

---

## 🎯 Success Metrics

### Week 1 Post-Launch
- [ ] 50+ downloads
- [ ] 10+ check-ins created
- [ ] 5+ courts saved by users
- [ ] <5% crash rate

### Month 1 Post-Launch
- [ ] 500+ downloads
- [ ] 100+ daily check-ins
- [ ] 20% user retention (7-day)
- [ ] 10+ user-submitted courts

### Month 3 Post-Launch
- [ ] 2,000+ downloads
- [ ] 500+ daily active users
- [ ] 30% user retention (7-day)
- [ ] Organic growth (word of mouth)

---

## 🔧 Technical Setup Checklist

### Pre-Development
- [x] Supabase project created
- [x] Environment variables configured (.env)
- [x] Git repository clean
- [x] Development branch created

### During Development
- [x] Check-ins table created in Supabase
- [x] Storage bucket created for photos
- [x] RLS policies configured
- [x] Test data seeded (Atlanta metro)

### Pre-Launch
- [x] App icons designed (1024×1024)
- [x] Splash screen created
- [ ] App Store listing copy written
- [ ] Privacy policy created
- [ ] Terms of service created
- [ ] TestFlight beta test (10+ users)
- [ ] Android internal testing (10+ users)

### Launch Day
- [ ] Submit to App Store (review takes 1-3 days)
- [ ] Submit to Google Play (review takes hours to days)
- [ ] Social media announcement ready
- [ ] Support email configured
- [ ] Analytics tracking verified

---

## 💡 Key Insights

### Your Competitive Advantage
> **The check-in feature is your moat.** Most court finders just show locations. You show where people are *actually playing right now*. This solves the real problem: "Where can I find a pickup game?"

### MVP Philosophy
> Ship the minimum that delivers value, then iterate based on user feedback. Don't build features users haven't asked for yet.

### Cost Control
> You can run this app for 6+ months on $124 total spend. Only pay for infrastructure when users demand it.

---

## 📞 Next Steps

1. **Review this plan** - Adjust timeline based on your availability
2. **Set up Supabase** - Create project, get API keys
3. **Create feature branch** - `git checkout -b mvp-launch`
4. **Start Week 1, Day 1** - Get Directions feature
5. **Daily commits** - Ship small, test often
6. **Week 3** - TestFlight beta
7. **Week 4** - App Store submission

---

## 🙋 Questions to Answer Before Starting

- [ ] iOS only, Android only, or both?
- [ ] Do you have a Mac? (required for iOS builds)
- [ ] Do you have Apple Developer account? ($99/year)
- [ ] What cities will you seed with initial court data?
- [ ] Do you have app icons/branding ready?
- [ ] Who will handle support emails?

---

**Last Updated:** 2026-03-13
**Version:** 1.1
**Status:** Pre-Launch — TestFlight & App Store prep remaining
