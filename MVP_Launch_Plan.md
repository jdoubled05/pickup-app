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

- [x] Get Directions integration (Apple/Google Maps via Linking API) <!-- notion:3285c00d-a466-810d-aa08-e4f716cead5d -->
- [x] Basic court filters (Indoor/Outdoor, Lighting, Hoops) <!-- notion:3285c00d-a466-8130-bf49-f5cba6cb5eba -->
- [x] Search by name/address <!-- notion:3285c00d-a466-811f-bb11-c78e9b16f443 -->
- [x] Filter UI components <!-- notion:3285c00d-a466-815d-a003-e0ff44a02006 -->

**Deliverable:** Users can filter courts and navigate to them

---

#### Day 3-4: Check-in Feature ⭐ (MVP Differentiator)
**Time: 16-20 hours**

- [x] "I'm Here" button on court detail page <!-- notion:3285c00d-a466-8136-924c-f65de93a490a -->
- [x] Display active check-ins count <!-- notion:3285c00d-a466-8127-aab0-ec4509089d46 -->
- [x] Auto-expire check-ins after 3 hours <!-- notion:3285c00d-a466-815a-a347-c07c63f3a940 -->
- [x] Supabase schema for check-ins table <!-- notion:3285c00d-a466-81d2-88f1-e12a69cf8c7b -->
- [x] Real-time subscription for live updates <!-- notion:3285c00d-a466-81bf-89de-cd71ba1a089f -->
- [x] Optimistic UI updates <!-- notion:3285c00d-a466-8157-a888-cdacd85039e1 -->

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

- [x] Remove all debug UI ("Mock data", "Live data" labels) <!-- notion:3285c00d-a466-813f-8d67-e4f3df59cf2c -->
- [x] Remove Supabase status indicators <!-- notion:3285c00d-a466-810f-bc6e-f526a252b97e -->
- [x] Remove coordinate displays <!-- notion:3285c00d-a466-8171-b233-caf086a4f98c -->
- [x] Fix duplicate sections in Profile tab (lines 37-48) <!-- notion:3285c00d-a466-819a-ab67-c0969c57180b -->
- [x] Format hours properly (convert JSON to "6:00 AM - 10:00 PM") <!-- notion:3285c00d-a466-81d2-a6c2-de1049b36f0c -->
- [x] Add haptic feedback for save/unsave actions <!-- notion:3285c00d-a466-8123-9e3f-cd8e336a3d7a -->
- [x] Better loading states (skeletons) <!-- notion:3285c00d-a466-8125-902b-e6b93e291a12 -->
- [x] Improve error messages (user-friendly) <!-- notion:3285c00d-a466-8160-b7e4-eec4d51f7224 -->
- [x] Add pull-to-refresh feedback <!-- notion:3285c00d-a466-8115-886a-ec064b4915a9 -->

**Deliverable:** App looks production-ready, not a prototype

---

#### Day 6: Photo Support
**Time: 10-12 hours**

- [x] Install expo-image-picker <!-- notion:3285c00d-a466-8182-90ca-c7e99486ddd1 -->
- [x] Court photo upload (1 photo per court for MVP) <!-- notion:3285c00d-a466-817f-86fc-ff9f345461aa -->
- [x] Display photo on detail page <!-- notion:3285c00d-a466-81f5-8647-ff46d0b7da27 -->
- [x] Supabase Storage bucket setup <!-- notion:3285c00d-a466-8177-aab9-e061bea83457 -->
- [x] Image compression before upload <!-- notion:3285c00d-a466-815f-85ff-c9a72460fb6e -->
- [x] Loading states for image uploads <!-- notion:3285c00d-a466-81ef-a4ca-eb78feedbbbf -->
- [x] Fallback for courts without photos <!-- notion:3285c00d-a466-8174-9057-e6aed299ce20 -->

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

- [ ] Add 15-20 diverse mock courts <!-- notion:3285c00d-a466-812e-8552-d2932113420f -->
  - [ ] New York City (3-4 courts) <!-- notion:3285c00d-a466-817e-a29d-dcd224640e4c -->
  - [ ] Los Angeles (3-4 courts) <!-- notion:3285c00d-a466-8102-86ad-eacfd138c69b -->
  - [ ] Chicago (2-3 courts) <!-- notion:3285c00d-a466-81b0-8b7a-f73d91bbff29 -->
  - [ ] Atlanta (2-3 courts) <!-- notion:3285c00d-a466-81e8-a537-e676e087cae7 -->
  - [ ] Miami (2-3 courts) <!-- notion:3285c00d-a466-81de-b6dc-f2f013d82abd -->
- [ ] Include variety: indoor, outdoor, different sizes, lighting <!-- notion:3285c00d-a466-8106-82e2-c6cf8fc4d0a5 -->
- [ ] Better empty states with "Add Court" CTAs <!-- notion:3285c00d-a466-8186-8f02-ff4572574bd4 -->
- [ ] Add court count to headers ("Courts (42 nearby)") <!-- notion:3285c00d-a466-81de-9f2d-d395009bf8c9 -->
- [ ] Empty saved list better messaging <!-- notion:3285c00d-a466-8172-8252-fa3c5ae5909f -->

**Deliverable:** App feels populated even without Supabase

---

### Week 3: Launch Prep (2-3 days)

#### Day 8: Share & Deep Linking
**Time: 8-10 hours**

- [x] Install expo-sharing (used native RN Share API instead — no install needed) <!-- notion:3285c00d-a466-8100-b37d-d39309d99a12 -->
- [x] Share court functionality (native share sheet) <!-- notion:3285c00d-a466-8188-9aeb-e66471c32232 -->
- [x] Deep link configuration (court/[id]) — Expo Router handles automatically <!-- notion:3285c00d-a466-8123-973c-fe26b6aafb38 -->
- [x] Handle incoming deep links (cold start + pending link after onboarding) <!-- notion:3285c00d-a466-81b2-820a-e370bd44bcb2 -->
- [x] Share includes: court name, address, app link <!-- notion:3285c00d-a466-8181-a00d-cc9ce3399152 -->
- [x] Test deep links on iOS/Android (Maestro 07_share flow passing) <!-- notion:3285c00d-a466-816a-9760-f7919f6b9fc2 -->

**Deliverable:** Users can share courts with friends

**Deep Link Format:**
```
pickupapp://court/123
https://pickup.app/court/123 (universal link)
```

---

#### Day 9: Onboarding
**Time: 6-8 hours**

- [x] Detect first launch (AsyncStorage flag) <!-- notion:3285c00d-a466-81c1-a254-f33e9aaa1051 -->
- [x] Welcome screen with value prop <!-- notion:3285c00d-a466-814a-94da-e26fb0b32f95 -->
- [x] Location permission explanation (before requesting) <!-- notion:3285c00d-a466-8169-ab30-cc4f3510c3cf -->
- [x] Quick 3-step feature tour <!-- notion:3285c00d-a466-8193-afa9-d26b0ba1d829 -->
- [x] Skip button for impatient users <!-- notion:3285c00d-a466-8189-ae9a-f3291357d051 -->
- [x] Don't show again on subsequent launches <!-- notion:3285c00d-a466-813d-97c7-e67f2e75a1bd -->

**Deliverable:** New users understand the app

**Onboarding Flow:**
1. Welcome → "Find pickup games near you"
2. Location → "We need your location to show nearby courts"
3. Features → "Check in when you arrive, save favorites"

---

#### Day 10: Testing & Bug Fixes
**Time: 8-10 hours**

- [x] End-to-end testing on iOS simulator (8/8 Maestro flows passing) <!-- notion:3285c00d-a466-81f7-82c4-f3b2927cd9a2 -->
- [ ] End-to-end testing on Android emulator <!-- notion:3285c00d-a466-8141-a9b2-e929ad24ce9f -->
- [ ] Test on physical devices (iOS + Android) <!-- notion:3285c00d-a466-813c-8af2-d1a8c9e6ab3c -->
- [ ] Location permission edge cases <!-- notion:3285c00d-a466-81f6-a74c-ebf6e608ed07 -->
- [ ] Network offline behavior <!-- notion:3285c00d-a466-8106-9e80-d4ecd9659443 -->
- [ ] Empty state testing <!-- notion:3285c00d-a466-8134-bb8e-c480da55d277 -->
- [x] Check-in expiration works correctly <!-- notion:3285c00d-a466-8173-9b3f-e1031548770e -->
- [x] Filter combinations work <!-- notion:3285c00d-a466-8169-81ad-cc0671ede523 -->
- [x] Deep links work from cold start <!-- notion:3285c00d-a466-8181-a884-f28dabd41ff7 -->
- [ ] Performance audit (remove console.logs) <!-- notion:3285c00d-a466-8155-9673-f638be54d98d -->
- [ ] Memory leak check <!-- notion:3285c00d-a466-813a-8c56-e91b1bc580f0 -->

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

- [x] Get Directions button <!-- notion:3285c00d-a466-8164-acac-c066113e529c -->
- [x] Check-in feature (your competitive moat) <!-- notion:3285c00d-a466-816b-b5f1-d718e9a923b6 -->
- [x] Remove all debug UI <!-- notion:3285c00d-a466-8123-b038-c72a428e7918 -->
- [x] Fix Profile tab duplication <!-- notion:3285c00d-a466-81ef-ad1e-cb3e83ffa53b -->
- [x] Better error states <!-- notion:3285c00d-a466-81bc-b533-fc28d5b65230 -->
- [x] Format hours properly <!-- notion:3285c00d-a466-8123-881e-ff874fb07ffe -->

**Why:** These make the app actually useful and not look like a prototype

---

### Phase 2: Strong Nice-to-Haves (Priority 2)
**Week 3 - Significantly improves UX**

- [x] Photo uploads <!-- notion:3285c00d-a466-8127-9b4a-c35aca54260d -->
- [x] Share/deep linking <!-- notion:3285c00d-a466-8148-92ef-e5deaa128e97 -->
- [x] Filters & search <!-- notion:3285c00d-a466-81c5-a275-cb5e7c076de5 -->
- [x] Onboarding flow <!-- notion:3285c00d-a466-8127-83a2-e804add29521 -->

**Why:** These improve retention and viral growth, but app works without them

---

### Phase 3: Post-Launch (Priority 3)
**Week 4+ - Based on user feedback**

- [ ] User accounts (anonymous → registered) <!-- notion:3285c00d-a466-8180-b54d-ed46d8e55fbe -->
- [ ] Push notifications ("3 people checked in at your saved court") <!-- notion:3285c00d-a466-816e-9192-c4e83e9cc4e9 -->
- [ ] Court ratings/reviews <!-- notion:3285c00d-a466-81ec-acc5-de898900c30f -->
- [ ] User-submitted courts (crowdsourcing) <!-- notion:3285c00d-a466-819d-9dbe-d4fc14054d6f -->
- [ ] Game scheduling <!-- notion:3285c00d-a466-81cf-b809-cfbf8a8df103 -->
- [ ] Court condition reporting <!-- notion:3285c00d-a466-8143-a4a3-c5e713b34a42 -->

**Why:** Don't build until users ask for them

---

## ⚡ Fast-Track Launch (1 Week Option)

If you need to launch in **5-7 days**, ship with ONLY:

### Must Have
- [x] Get Directions button (4 hours) <!-- notion:3285c00d-a466-810e-9ec9-f565e577e116 -->
- [x] Check-in feature (16 hours) <!-- notion:3285c00d-a466-817b-be02-e191c7fcb52b -->
- [x] Remove debug UI (4 hours) <!-- notion:3285c00d-a466-81c8-b474-e9080d503646 -->
- [x] Better error handling (4 hours) <!-- notion:3285c00d-a466-81df-87f9-ec184859ff72 -->

### Skip for v1.0
- [ ] Photos (ship in v1.1) <!-- notion:3285c00d-a466-81ad-9c89-e54f6b60431d -->
- [x] Sharing (shipped in v1.0) <!-- notion:3285c00d-a466-8100-9771-e258452e6181 -->
- [x] Filters (shipped in v1.0) <!-- notion:3285c00d-a466-8197-a48e-dbc54b1fa09e -->
- [x] Onboarding (shipped in v1.0) <!-- notion:3285c00d-a466-8140-88d6-e0e3259b79ae -->

**Total time: 28-32 hours (1 week)**

This gives users **80% of the value in 40% of the time**. Launch, get feedback, iterate.

---

## 🎯 Success Metrics

### Week 1 Post-Launch
- [ ] 50+ downloads <!-- notion:3285c00d-a466-813d-a57b-fee37318f0b5 -->
- [ ] 10+ check-ins created <!-- notion:3285c00d-a466-81ea-ae18-cab2dd31d232 -->
- [ ] 5+ courts saved by users <!-- notion:3285c00d-a466-81e8-9bbe-cf202c408358 -->
- [ ] <5% crash rate <!-- notion:3285c00d-a466-812d-ac8b-ee252d3cbb2e -->

### Month 1 Post-Launch
- [ ] 500+ downloads <!-- notion:3285c00d-a466-811f-bbe5-f82da7401fe5 -->
- [ ] 100+ daily check-ins <!-- notion:3285c00d-a466-8121-ad8a-ead0460aa275 -->
- [ ] 20% user retention (7-day) <!-- notion:3285c00d-a466-81f1-a46a-cbe21cf4bb66 -->
- [ ] 10+ user-submitted courts <!-- notion:3285c00d-a466-8194-a121-f4f0c80d44db -->

### Month 3 Post-Launch
- [ ] 2,000+ downloads <!-- notion:3285c00d-a466-810e-a559-fc0d08d31d1c -->
- [ ] 500+ daily active users <!-- notion:3285c00d-a466-8160-8703-caff25ef65a9 -->
- [ ] 30% user retention (7-day) <!-- notion:3285c00d-a466-8101-9acf-e2af410a3c09 -->
- [ ] Organic growth (word of mouth) <!-- notion:3285c00d-a466-81a6-8b73-ca298aaa74bc -->

---

## 🔧 Technical Setup Checklist

### Pre-Development
- [x] Supabase project created <!-- notion:3285c00d-a466-81e7-ad22-ec8f623c65c0 -->
- [x] Environment variables configured (.env) <!-- notion:3285c00d-a466-815b-9714-ee41f582c093 -->
- [x] Git repository clean <!-- notion:3285c00d-a466-8102-b498-ce47eace902b -->
- [x] Development branch created <!-- notion:3285c00d-a466-8181-93f1-c8096da85bb3 -->

### During Development
- [x] Check-ins table created in Supabase <!-- notion:3285c00d-a466-81a8-af24-f4f49717c0e8 -->
- [x] Storage bucket created for photos <!-- notion:3285c00d-a466-81dd-90a2-dbc885e55171 -->
- [x] RLS policies configured <!-- notion:3285c00d-a466-8186-9665-c58606e4d261 -->
- [x] Test data seeded (Atlanta metro) <!-- notion:3285c00d-a466-81b6-bcea-ef6cd8d035ef -->

### Pre-Launch
- [x] App icons designed (1024×1024) <!-- notion:3285c00d-a466-8117-a788-e279cfc0103e -->
- [x] Splash screen created <!-- notion:3285c00d-a466-8134-ad51-e74c47343dab -->
- [ ] App Store listing copy written <!-- notion:3285c00d-a466-81db-97dc-f09ab00781fe -->
- [x] Privacy policy created <!-- notion:3285c00d-a466-817c-83c5-ccdd5892c928 -->
- [x] Terms of service created <!-- notion:3285c00d-a466-81c5-b686-ef719052202a -->
- [ ] TestFlight beta test (10+ users) <!-- notion:3285c00d-a466-81b6-93be-c954d21eb4b3 -->
- [ ] Android internal testing (10+ users) <!-- notion:3285c00d-a466-8137-bbc7-ce53e032dcc3 -->

### Launch Day
- [ ] Submit to App Store (review takes 1-3 days) <!-- notion:3285c00d-a466-819a-bbab-c39feac7d637 -->
- [ ] Submit to Google Play (review takes hours to days) <!-- notion:3285c00d-a466-81b5-9043-d9a5bab061b2 -->
- [ ] Social media announcement ready <!-- notion:3285c00d-a466-81f2-8fe3-c7c0138adc7e -->
- [x] Support email configured (referenced in privacy policy) <!-- notion:3285c00d-a466-8140-93c2-ce27fdf079a1 -->
- [ ] Analytics tracking verified <!-- notion:3285c00d-a466-8150-b75e-cdc9331b40e9 -->

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

- [ ] iOS only, Android only, or both? <!-- notion:3285c00d-a466-811a-aead-da6f6a08cd7a -->
- [ ] Do you have a Mac? (required for iOS builds) <!-- notion:3285c00d-a466-81a3-8890-ec6feb98359c -->
- [ ] Do you have Apple Developer account? ($99/year) <!-- notion:3285c00d-a466-8148-864e-cf116bb875bd -->
- [ ] What cities will you seed with initial court data? <!-- notion:3285c00d-a466-8129-88c8-f46e15b50b3f -->
- [ ] Do you have app icons/branding ready? <!-- notion:3285c00d-a466-8154-8976-f28b216b91da -->
- [ ] Who will handle support emails? <!-- notion:3285c00d-a466-8102-ba8c-c1886aacf904 -->

---

**Last Updated:** 2026-03-13
**Version:** 1.1
**Status:** Pre-Launch — TestFlight & App Store prep remaining
