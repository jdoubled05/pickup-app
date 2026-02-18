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

- [ ] Get Directions integration (Apple/Google Maps via Linking API)
- [ ] Basic court filters (Indoor/Outdoor, Lighting, Hoops)
- [ ] Search by name/address
- [ ] Filter UI components

**Deliverable:** Users can filter courts and navigate to them

---

#### Day 3-4: Check-in Feature ⭐ (MVP Differentiator)
**Time: 16-20 hours**

- [ ] "I'm Here" button on court detail page
- [ ] Display active check-ins count
- [ ] Auto-expire check-ins after 3 hours
- [ ] Supabase schema for check-ins table
- [ ] Real-time subscription for live updates
- [ ] Optimistic UI updates

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

- [ ] Remove all debug UI ("Mock data", "Live data" labels)
- [ ] Remove Supabase status indicators
- [ ] Remove coordinate displays
- [ ] Fix duplicate sections in Profile tab (lines 37-48)
- [ ] Format hours properly (convert JSON to "6:00 AM - 10:00 PM")
- [ ] Add haptic feedback for save/unsave actions
- [ ] Better loading states (skeletons)
- [ ] Improve error messages (user-friendly)
- [ ] Add pull-to-refresh feedback

**Deliverable:** App looks production-ready, not a prototype

---

#### Day 6: Photo Support
**Time: 10-12 hours**

- [ ] Install expo-image-picker
- [ ] Court photo upload (1 photo per court for MVP)
- [ ] Display photo on detail page
- [ ] Supabase Storage bucket setup
- [ ] Image compression before upload
- [ ] Loading states for image uploads
- [ ] Fallback for courts without photos

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

- [ ] Install expo-sharing
- [ ] Share court functionality (native share sheet)
- [ ] Deep link configuration (court/[id])
- [ ] Handle incoming deep links
- [ ] Share includes: court name, address, app link
- [ ] Test deep links on iOS/Android

**Deliverable:** Users can share courts with friends

**Deep Link Format:**
```
pickupapp://court/123
https://pickup.app/court/123 (universal link)
```

---

#### Day 9: Onboarding
**Time: 6-8 hours**

- [ ] Detect first launch (AsyncStorage flag)
- [ ] Welcome screen with value prop
- [ ] Location permission explanation (before requesting)
- [ ] Quick 3-step feature tour
- [ ] Skip button for impatient users
- [ ] Don't show again on subsequent launches

**Deliverable:** New users understand the app

**Onboarding Flow:**
1. Welcome → "Find pickup games near you"
2. Location → "We need your location to show nearby courts"
3. Features → "Check in when you arrive, save favorites"

---

#### Day 10: Testing & Bug Fixes
**Time: 8-10 hours**

- [ ] End-to-end testing on iOS simulator
- [ ] End-to-end testing on Android emulator
- [ ] Test on physical devices (iOS + Android)
- [ ] Location permission edge cases
- [ ] Network offline behavior
- [ ] Empty state testing
- [ ] Check-in expiration works correctly
- [ ] Filter combinations work
- [ ] Deep links work from cold start
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

- [ ] Photo uploads
- [ ] Share/deep linking
- [ ] Filters & search
- [ ] Onboarding flow

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
- [ ] Sharing (ship in v1.1)
- [ ] Filters (ship in v1.1)
- [ ] Onboarding (ship in v1.1)

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
- [ ] Supabase project created
- [ ] Environment variables configured (.env)
- [ ] Git repository clean
- [ ] Development branch created

### During Development
- [ ] Check-ins table created in Supabase
- [ ] Storage bucket created for photos
- [ ] RLS policies configured
- [ ] Test data seeded

### Pre-Launch
- [ ] App icons designed (1024×1024)
- [ ] Splash screen created
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

**Last Updated:** 2026-02-13
**Version:** 1.0
**Status:** Ready to Execute
