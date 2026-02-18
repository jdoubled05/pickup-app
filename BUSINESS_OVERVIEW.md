# PICKUP: Comprehensive Business & Product Overview

**Last Updated:** February 2026
**Version:** 1.0 MVP
**Status:** Production Ready - Pre-Launch

---

## Executive Summary

**Pickup** is a mobile-first React Native application solving a fundamental problem for basketball players: **discovering active pickup games happening right now, not just court locations.**

Through anonymous real-time check-ins, location-based search, and live activity indicators, Pickup enables players to find courts with active games within seconds—eliminating the frustration of showing up to empty courts.

### Key Metrics (Target)
- **Target Launch:** 6-8 weeks (post-beta testing)
- **Initial Market:** Atlanta, GA (529+ courts)
- **Revenue Potential:** $1M+ annually at 100K MAU
- **Critical Mass Required:** 500-1,000 users per metro
- **Technical Status:** MVP Complete, Production Ready

---

## Table of Contents

1. [Product Overview](#product-overview)
2. [Market Opportunity](#market-opportunity)
3. [Core Features](#core-features)
4. [Technical Architecture](#technical-architecture)
5. [Business Model & Monetization](#business-model--monetization)
6. [Competitive Landscape](#competitive-landscape)
7. [Growth Strategy](#growth-strategy)
8. [Financial Projections](#financial-projections)
9. [Risks & Mitigation](#risks--mitigation)
10. [Roadmap & Milestones](#roadmap--milestones)

---

## Product Overview

### The Problem

Basketball players face a consistent challenge when looking for pickup games:
- **Uncertainty:** "Will anyone be at the court when I get there?"
- **Wasted Time:** Driving 15-30 minutes to find empty courts
- **Social Friction:** Difficulty connecting with local basketball community
- **Information Gap:** Court directories exist, but activity data doesn't

Existing solutions (court finders, social apps) only show **where courts are**, not **where games are happening**.

### The Solution

Pickup provides real-time activity visibility through:
- **Anonymous Check-Ins:** Tap "I'm Here" when arriving at a court (3-hour expiration)
- **Live Activity Feed:** "Hot Courts" section shows courts with active players right now
- **Location-Based Discovery:** 50km radius search, sorted by distance
- **Push Notifications:** Get alerted when players check in nearby (opt-in)
- **Zero Friction:** No accounts required—completely anonymous

### Target Audience

**Primary Users:**
- Age: 16-45
- Demographics: Basketball enthusiasts, mobile-first users
- Psychographics: Active lifestyle, social, competitive
- Use Cases:
  - New to area, seeking local courts
  - Casual players looking for spontaneous games
  - Regular players checking if "their court" is active

**Secondary Users (Future):**
- Court operators (gyms, parks departments)
- League organizers
- Basketball training programs

### Value Proposition

**For Players:**
> "See who's playing right now. Save time, find games, join the community."

**For Court Operators (Future):**
> "Real-time occupancy data, community engagement, and marketing reach."

---

## Market Opportunity

### Market Size

**TAM (Total Addressable Market):**
- 26 million Americans play basketball regularly (SFIA, 2024)
- 75% use smartphones for sports activities
- **TAM:** ~19.5M potential users

**SAM (Serviceable Addressable Market):**
- Focus on top 50 US metros with 500+ courts
- Estimated 8-10 million active basketball players in these areas
- **SAM:** ~8M users

**SOM (Serviceable Obtainable Market - Year 1):**
- Launch in 2-3 major metros (Atlanta, LA, NYC)
- Target 1-2% market penetration
- **SOM:** 100K-200K users

### Market Trends

1. **Rise of On-Demand Sports:** Players expect real-time availability (Uber for sports)
2. **Anonymous Social:** Growing preference for privacy-first apps
3. **Hyperlocal Community Tools:** Nextdoor, Citizen show demand for location-based social
4. **Court Crowding Post-Pandemic:** Public courts more popular than ever

---

## Core Features

### MVP Features (✅ Complete)

#### 1. Real-Time Check-Ins
- **How it works:** Tap "I'm Here" at a court → visible to all users for 3 hours
- **Technology:** Supabase Realtime subscriptions (<2 sec latency)
- **Privacy:** Anonymous device ID-based, no personal data stored
- **Business Value:** Core differentiator, creates network effects

#### 2. Court Discovery & Search
- **Database:** 529 real courts (Atlanta area, from OpenStreetMap)
- **Search:** 50km radius, sorted by distance from user location
- **Filtering:** Indoor/outdoor, lighting, multiple hoops, 24-hour access, distance
- **Business Value:** Comprehensive court data = higher user trust

#### 3. Hot Courts Section
- **Display:** Courts with active check-ins shown prominently at top
- **Sorting:** By player count (most active first)
- **Visual:** Pulsing "LIVE NOW" indicator, player count badges
- **Business Value:** Drives engagement, solves core user need

#### 4. Court Details Page
- **Information:** Name, address, type, hoops, lighting, surface, hours
- **Actions:** Check in, save, get directions
- **Live Data:** Real-time check-in count, pulsing activity indicator
- **Business Value:** Complete information reduces uncertainty

#### 5. Save Favorites
- **Storage:** Local device (AsyncStorage, no backend)
- **Access:** Quick access from Profile tab
- **Business Value:** Retention driver, personalization

#### 6. Interactive Map View
- **Visualization:** All courts as map pins, user location centering
- **Interactions:** Tap pin → preview sheet, tap card → full detail
- **Hot Courts:** Red pins for active courts
- **Business Value:** Discovery UX, visual browsing

#### 7. Get Directions
- **Integration:** Native maps (Apple Maps on iOS, Google Maps on Android)
- **Deep Links:** One-tap navigation from court to user location
- **Business Value:** Reduces friction in user journey

#### 8. Weather Integration
- **API:** WeatherAPI.com (free tier, 1M calls/month)
- **Display:** Temperature + condition emoji on every court card
- **Caching:** 30-minute TTL, 5km grid cells (optimizes API usage)
- **Business Value:** Helps outdoor players make informed decisions

#### 9. Push Notifications
- **Trigger:** Nearby check-ins (1-3 players only, to avoid spam)
- **Debouncing:** Max 1 notification per court per 5 minutes
- **Deep Links:** Tap notification → court detail page
- **Opt-In:** Toggle in Profile settings
- **Business Value:** Retention, re-engagement, FOMO creation

#### 10. Swipe Gestures
- **Swipe Right:** Get directions immediately
- **Swipe Left:** Save court to favorites
- **Haptic Feedback:** Tactile confirmation
- **Business Value:** Power user feature, faster workflows

#### 11. Professional UI/UX
- **Dark/Light Mode:** Automatic system theme detection
- **Accessibility:** WCAG AA compliant, 44pt touch targets, screen reader support
- **Loading States:** Skeleton screens, error handling, empty states
- **Animations:** Smooth transitions, pull-to-refresh with basketball bounce
- **Business Value:** Premium feel, App Store feature-worthy

---

## Technical Architecture

### Tech Stack

**Frontend:**
- **Framework:** React Native 0.81.5 + Expo 54
- **Routing:** Expo Router 6.0 (file-based, type-safe)
- **Styling:** NativeWind 4.2 (Tailwind CSS for React Native)
- **Maps:** MapLibre React Native 10.4
- **State:** React Hooks (no Redux complexity)
- **Language:** TypeScript (strict mode)

**Backend:**
- **BaaS:** Supabase (PostgreSQL + PostGIS + Realtime)
- **Database:** PostgreSQL 15 with PostGIS 3.4
- **Realtime:** WebSocket-based Postgres Changes subscriptions
- **Storage:** Supabase Storage (for future court photos)
- **Auth:** Anonymous (device ID-based, no accounts)

**Third-Party Services:**
- **Weather:** WeatherAPI.com (free tier)
- **Maps:** Apple Maps (iOS), Google Maps (Android)
- **Notifications:** Expo Push Notifications (free)

### System Architecture

```
┌─────────────────┐
│   Mobile App    │
│ (React Native)  │
└────────┬────────┘
         │
         ├──────────────┐
         │              │
         v              v
┌────────────────┐  ┌────────────────┐
│   Supabase     │  │  WeatherAPI    │
│   Backend      │  │  (External)    │
├────────────────┤  └────────────────┘
│ • PostgreSQL   │
│ • PostGIS      │
│ • Realtime     │
│ • RLS Security │
└────────────────┘
         │
         v
┌────────────────────┐
│  Courts DB         │
│  529 courts        │
│  Check-Ins Table   │
│  3-hour expiration │
└────────────────────┘
```

### Data Models

**Courts Table:**
```sql
CREATE TABLE courts (
  id TEXT PRIMARY KEY,              -- OpenStreetMap ID
  name TEXT NOT NULL,
  address TEXT,
  city TEXT, state TEXT, postal_code TEXT,
  country TEXT DEFAULT 'United States',
  latitude NUMERIC, longitude NUMERIC,
  location GEOGRAPHY(Point, 4326),  -- PostGIS for spatial queries

  -- Court attributes
  indoor BOOLEAN,
  surface_type TEXT,                -- asphalt, concrete, hardwood, rubber
  num_hoops INTEGER,
  lighting BOOLEAN,
  open_24h BOOLEAN,
  hours_json JSONB,
  amenities_json JSONB,

  -- Metadata
  osm_type TEXT, osm_id BIGINT,
  photos_count INTEGER DEFAULT 0,
  photo_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_courts_location ON courts USING GIST(location);
```

**Check-Ins Table:**
```sql
CREATE TABLE check_ins (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  court_id TEXT REFERENCES courts(id) ON DELETE CASCADE,
  anonymous_user_id TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '3 hours')
);

CREATE INDEX idx_checkins_court ON check_ins(court_id);
CREATE INDEX idx_checkins_expires ON check_ins(expires_at);

-- Row Level Security: Allow all reads, restrict writes to valid users
ALTER TABLE check_ins ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow anyone to read check-ins" ON check_ins FOR SELECT USING (true);
CREATE POLICY "Allow insert with valid user ID" ON check_ins FOR INSERT WITH CHECK (true);
```

**RPC Functions:**
```sql
-- Get nearby courts with distance calculation
CREATE FUNCTION courts_nearby(user_lat NUMERIC, user_lon NUMERIC, radius_meters INTEGER)
RETURNS TABLE (/* ... court columns ... */, distance_meters NUMERIC)
AS $$
  SELECT *,
    ST_Distance(location, ST_SetSRID(ST_Point(user_lon, user_lat), 4326)::geography) AS distance_meters
  FROM courts
  WHERE ST_DWithin(location, ST_SetSRID(ST_Point(user_lon, user_lat), 4326)::geography, radius_meters)
  ORDER BY distance_meters ASC;
$$;

-- Get court by ID
CREATE FUNCTION court_by_id(court_id TEXT)
RETURNS courts AS $$
  SELECT * FROM courts WHERE id = court_id LIMIT 1;
$$;

-- Get active check-ins count
CREATE FUNCTION get_active_checkins(court_id TEXT)
RETURNS INTEGER AS $$
  SELECT COUNT(*) FROM check_ins
  WHERE court_id = $1 AND expires_at > NOW();
$$;
```

### Real-Time Data Flow

```
User Opens Court Detail
    ↓
Subscribe to Realtime Channel: "court-checkins:${courtId}"
    ↓
Listen for: INSERT, UPDATE, DELETE on check_ins table
    ↓
On Change → Refetch active count → Update UI (< 2 sec latency)
    ↓
Unsubscribe on Page Leave
```

**Key Features:**
- No polling required (WebSocket-based)
- Automatic reconnection on network change
- Broadcast to all connected clients instantly
- Minimal bandwidth (only changes sent, not full state)

### Scalability Considerations

**Current Capacity:**
- Supabase Free Tier: 500MB database, 2GB bandwidth/month
- Realtime: 200 concurrent connections
- **Estimated Support:** 1,000-5,000 DAU

**Production Tier ($25/month):**
- 8GB database, 250GB bandwidth/month
- Realtime: Unlimited connections
- **Estimated Support:** 100K+ DAU

**Optimization Strategies:**
- PostGIS spatial indexing (sub-100ms queries)
- Weather caching (30-min TTL, 5km grid)
- Check-in auto-expiration (background job)
- Image CDN (future: Supabase Storage + Cloudflare)

---

## Business Model & Monetization

### Current Status
**Free MVP** - No monetization implemented

### Revenue Streams (Post-MVP)

#### 1. Premium Subscription ($4.99/month or $39.99/year)

**Features:**
- ⭐ Advanced filtering (skill level, game type, court quality)
- 📊 Personal stats (games played, favorite courts, check-in history)
- 🔔 Custom notifications (notify when X players arrive, court-specific alerts)
- 👤 Player profiles with reputation badges
- 📸 Unlimited court photo uploads
- 🎨 Custom app themes and icons
- 🏆 Leaderboard rankings

**Target Conversion:** 10-15% of MAU
**Estimated ARPU:** $3.50-$4.00/month (accounting for annual discounts)

#### 2. Court Operator Partnerships ($99-$500/month per venue)

**B2B SaaS Offering:**
- 📊 Real-time occupancy dashboard
- 📅 Game scheduling and promotion tools
- 📣 Push promotions to users ("Half-court open now!")
- 📈 Analytics (peak hours, user demographics)
- 🏷️ Verified badge on court listing
- 🎫 Event management (tournaments, leagues)
- 📸 Professional court photography

**Target Market:**
- Indoor basketball gyms (LA Fitness, 24 Hour Fitness, local gyms)
- Community centers with courts
- Universities and colleges
- Parks & recreation departments

**Estimated Venues:** 50-100 in Year 1 (across 3 metros)

#### 3. In-App Advertising (Native, Non-Intrusive)

**Ad Placements:**
- Sponsored court listings (top 3 positions)
- Branded weather badges ("Nike presents weather")
- Post-check-in interstitials ("Congrats! Try Gatorade G-Series")

**Target Advertisers:**
- Sports apparel (Nike, Under Armour, Adidas)
- Sports drinks (Gatorade, Powerade, BodyArmor)
- Basketball equipment (Spalding, Wilson)
- Local sports bars and restaurants

**Estimated CPM:** $5-$15 (basketball-focused audience)
**Ad Load:** 1-2 ads per session (low intrusion)

#### 4. Transaction Fees (Future)

**Use Cases:**
- Court booking/reservation fees (10% commission)
- Tournament registration (15% commission)
- Merchandise sales (branded Pickup gear, 30% margin)
- Coaching/training session bookings (20% commission)

### Unit Economics (100K MAU Projection)

```
Revenue Streams:
├─ Premium Subscriptions
│  ├─ 10% conversion = 10,000 subscribers
│  ├─ $4.99/month × 10,000 = $49,900/month
│  └─ Annual: $598,800
├─ Court Partnerships
│  ├─ 75 venues × $250/month avg = $18,750/month
│  └─ Annual: $225,000
├─ In-App Advertising
│  ├─ 100K MAU × 10 sessions/month = 1M impressions
│  ├─ $10 CPM × 1M = $10,000/month
│  └─ Annual: $120,000
└─ Transaction Fees (Year 2+)
   └─ Annual: $50,000-$100,000 (estimated)
─────────────────────────────────────────
Total Annual Revenue (100K MAU): ~$943,800

Operating Costs:
├─ Supabase (Production): $300/month → $3,600/year
├─ WeatherAPI (Pro): $100/month → $1,200/year
├─ Expo Push Notifications: $0 (free tier sufficient)
├─ Apple Developer: $99/year
├─ Google Play: $25 one-time
├─ Domain & Hosting: $200/year
├─ Support & Operations: $50,000/year (1 part-time)
└─ Marketing & User Acquisition: $100,000/year
─────────────────────────────────────────
Total Operating Costs: ~$155,000/year

Gross Profit: $788,800/year
Gross Margin: 83.6%
```

### Pricing Strategy

**Premium Tier:**
- Monthly: $4.99 (competitive with Strava, Fitbit Premium)
- Annual: $39.99 (20% discount, encourages commitment)
- Student: $2.99/month (50% off, builds user base)

**Court Partnerships:**
- Freemium: Basic listing (free)
- Pro: $99/month (analytics, verified badge)
- Enterprise: $499/month (full dashboard, API access, white-label)

**Launch Promotion:**
- First 1,000 subscribers: Lifetime 50% off ($2.49/month)
- First 10 venue partners: 3 months free

---

## Competitive Landscape

### Direct Competitors

#### 1. **CourtSpotter** (Hypothetical)
- **Description:** Court finder with static listings
- **Strengths:** Large database, established brand
- **Weaknesses:** No real-time activity, requires accounts
- **Differentiation:** Pickup's live check-ins solve the core problem

#### 2. **Pickup Basketball App** (Generic)
- **Description:** Social network for basketball players
- **Strengths:** Player profiles, game scheduling
- **Weaknesses:** Complex, requires accounts, low adoption
- **Differentiation:** Pickup's simplicity and anonymity

#### 3. **Google Maps / Yelp**
- **Description:** General location search
- **Strengths:** Universal adoption, trusted data
- **Weaknesses:** No activity data, not basketball-specific
- **Differentiation:** Pickup is purpose-built for finding active games

### Indirect Competitors

- **Meetup.com** - Organized group sports (too formal)
- **Facebook Groups** - Local basketball communities (not real-time)
- **Nextdoor** - Neighborhood connections (general purpose)
- **Strava** - Activity tracking (no discovery features)

### Competitive Advantages

1. ✅ **Real-Time Activity Data** - Unique differentiator
2. ✅ **Anonymous/Frictionless** - No accounts = higher adoption
3. ✅ **Mobile-First UX** - Superior to web-based alternatives
4. ✅ **Hyperlocal Focus** - Deep vertical vs. horizontal platforms
5. ✅ **Network Effects** - More users = more value (high moat once established)

### Barriers to Entry

**Low Barriers:**
- Open source tech stack (React Native, Supabase)
- Court data available publicly (OpenStreetMap)
- No proprietary technology

**High Barriers (Post-Launch):**
- Network effects (critical mass in each metro)
- Court operator partnerships (exclusive relationships)
- User-generated content (reviews, photos)
- Brand recognition and trust

**Defensibility Strategy:**
- Move fast in key metros to build critical mass
- Lock in court partnerships early (exclusive premium listings)
- Build community and social features (high switching cost)
- Data moat (court quality ratings, peak hours analytics)

---

## Growth Strategy

### Phase 1: Launch & Local Domination (Months 1-6)

**Goal:** Achieve critical mass in 1-2 metros (Atlanta, LA)

**Tactics:**
1. **Guerrilla Marketing**
   - QR code flyers at top 50 courts
   - Chalk art/court graffiti with app branding
   - Street team handing out branded wristbands

2. **Court Operator Partnerships**
   - Pitch to 10-20 gyms/rec centers
   - Free premium listings for first 3 months
   - Cross-promotion (gym displays QR codes)

3. **Influencer Seeding**
   - 20-30 local basketball Instagram influencers
   - Free premium accounts + cash bonus for promotion
   - Authentic content (playing at courts, checking in)

4. **Community Events**
   - Host "Pickup Games" at popular courts
   - Free branded gear for attendees
   - In-person app education and sign-ups

5. **Word-of-Mouth Incentives**
   - Referral program: Both users get 1 month free premium
   - Court "founder" badges for first 10 check-ins

**Target Metrics:**
- 5,000 downloads in Month 1
- 1,000+ MAU by Month 3
- 50+ daily check-ins in each metro by Month 6

### Phase 2: Geographic Expansion (Months 7-12)

**Goal:** Launch in 3-5 additional metros

**Target Cities:**
- NYC (high density, year-round indoor courts)
- Chicago (strong basketball culture)
- Houston (warm climate, outdoor courts)
- Phoenix (year-round outdoor play)

**Tactics:**
1. **Replicate Phase 1 playbook in each city**
2. **Leverage existing users for referrals to friends in new cities**
3. **Local sports media coverage (press releases, podcast interviews)**
4. **College campus ambassadors (ASU, UH, etc.)**

**Target Metrics:**
- 50K total downloads by Month 12
- 10K MAU across all metros
- 1,000+ daily check-ins platform-wide

### Phase 3: Feature Expansion & Monetization (Months 13-24)

**Goal:** Activate revenue streams, build retention

**Tactics:**
1. **Launch Premium Subscription** (Month 13)
   - Limited-time founder pricing ($2.99/month)
   - Heavy promotion to existing users

2. **Court Partnership Program** (Month 15)
   - Onboard 50+ venues across all metros
   - B2B sales team (2-3 reps)

3. **In-App Advertising** (Month 18)
   - Pilot with 2-3 brands (Nike, Gatorade)
   - Native ad formats only

4. **Community Features** (Month 20)
   - Player profiles and reputation system
   - Game scheduling and invites
   - Leaderboards and achievements

**Target Metrics:**
- 100K total downloads by Month 24
- 25K MAU
- $50K MRR (Monthly Recurring Revenue)
- 10% premium conversion rate

### Phase 4: Scale & Diversification (Year 3+)

**Goal:** Expand to adjacent sports, international markets

**Tactics:**
1. **Adjacent Sports** (Soccer, Tennis, Volleyball)
   - Leverage existing infrastructure
   - Cross-sell to basketball users

2. **International Expansion** (UK, Australia, Canada)
   - English-speaking markets first
   - Partner with local sports organizations

3. **API & Platform Business**
   - Public API for third-party developers
   - White-label solution for sports organizations
   - B2B2C channel (e.g., Nike uses Pickup to promote courts)

**Target Metrics:**
- 500K+ total users
- $2M+ ARR
- Profitability achieved

---

## Financial Projections

### Year 1 Forecast (Conservative)

```
Assumptions:
- Launch: Month 1
- 2 metros in first 6 months
- 5 metros by end of Year 1
- No monetization until Month 13

Q1 (Months 1-3):
├─ Downloads: 10,000
├─ MAU: 2,000
├─ Revenue: $0
└─ Costs: $20,000 (marketing, infrastructure)

Q2 (Months 4-6):
├─ Downloads: 25,000 (cumulative)
├─ MAU: 5,000
├─ Revenue: $0
└─ Costs: $30,000

Q3 (Months 7-9):
├─ Downloads: 50,000 (cumulative)
├─ MAU: 10,000
├─ Revenue: $0
└─ Costs: $40,000

Q4 (Months 10-12):
├─ Downloads: 75,000 (cumulative)
├─ MAU: 15,000
├─ Revenue: $0
└─ Costs: $50,000

Year 1 Totals:
├─ Total Downloads: 75,000
├─ Ending MAU: 15,000
├─ Revenue: $0
├─ Total Costs: $140,000
└─ Net: -$140,000
```

### Year 2 Forecast (Moderate Growth + Monetization)

```
Assumptions:
- Premium launched Month 13
- Court partnerships active Month 15
- Ads launched Month 18
- 10-15 total metros by end of Year 2

Q1 (Months 13-15):
├─ MAU: 25,000
├─ Premium Subscribers: 1,500 (6% conversion)
├─ Revenue: $22,500 (subscriptions + 5 court partnerships)
└─ Costs: $40,000

Q2 (Months 16-18):
├─ MAU: 40,000
├─ Premium Subscribers: 3,000 (7.5% conversion)
├─ Revenue: $40,000 (subs + 15 partnerships + ads pilot)
└─ Costs: $50,000

Q3 (Months 19-21):
├─ MAU: 60,000
├─ Premium Subscribers: 5,000 (8.3% conversion)
├─ Revenue: $70,000 (subs + 30 partnerships + ads)
└─ Costs: $60,000

Q4 (Months 22-24):
├─ MAU: 80,000
├─ Premium Subscribers: 7,500 (9.4% conversion)
├─ Revenue: $110,000 (subs + 50 partnerships + ads)
└─ Costs: $70,000

Year 2 Totals:
├─ Ending MAU: 80,000
├─ Total Revenue: $242,500
├─ Total Costs: $220,000
├─ Net: +$22,500 (first profitable quarter: Q4)
└─ Cumulative: -$117,500
```

### Year 3 Forecast (Scale & Profitability)

```
Assumptions:
- 20+ metros covered
- Mature product with all monetization streams active
- Adjacent sports pilots launched

Q1-Q4 (Months 25-36):
├─ Ending MAU: 150,000
├─ Premium Subscribers: 18,000 (12% conversion)
├─ Total Revenue: $1,080,000
│  ├─ Subscriptions: $720,000
│  ├─ Court Partnerships: $240,000 (80 venues)
│  ├─ Advertising: $100,000
│  └─ Transactions: $20,000
├─ Total Costs: $400,000
│  ├─ Infrastructure: $20,000
│  ├─ Marketing: $200,000
│  ├─ Operations: $150,000
│  └─ Support: $30,000
├─ Net: +$680,000
└─ Cumulative: +$562,500
```

### Break-Even Analysis

**Target Break-Even:** Month 22 (Q4 Year 2)

**Requirements:**
- 80,000 MAU
- 7,500 premium subscribers
- 50 court partnerships
- $110,000 monthly revenue

**Key Levers:**
1. Premium conversion rate (target: 10-12%)
2. Court partnership sales (target: 100+ venues by end Year 2)
3. User acquisition cost (target: <$3 per install)
4. Retention rate (target: 40% 30-day retention)

---

## Risks & Mitigation

### Critical Risks

#### 1. Cold Start Problem (HIGH RISK)
**Risk:** App requires critical mass to provide value → chicken & egg

**Impact:** User downloads app, sees no check-ins, uninstalls
**Probability:** High (80%) without mitigation

**Mitigation:**
- Seed users in concentrated areas (guerrilla marketing at top courts)
- Partner with leagues/gyms to pre-populate check-ins
- Show "court activity history" even with no live check-ins
- Incentivize early check-ins (badges, premium access)
- Start with 1-2 high-traffic courts per metro (concentrated effort)

#### 2. Fraudulent Check-Ins (MEDIUM RISK)
**Risk:** Users fake check-ins to game the system or troll

**Impact:** Reduces trust, degrades core value proposition
**Probability:** Medium (40%) as app scales

**Mitigation:**
- Geofencing (require GPS proximity to court within 100m)
- Rate limiting (max 1 check-in per 30 minutes)
- Reputation system (flag suspicious users)
- Court operator verification (venues can confirm/deny activity)
- Machine learning fraud detection (pattern analysis)

#### 3. Low Retention (HIGH RISK)
**Risk:** Users download for one-time use, don't return

**Impact:** High CAC with low LTV = unsustainable unit economics
**Probability:** Medium-High (60%) without retention features

**Mitigation:**
- Push notifications (nearby check-ins, favorite courts active)
- Habit formation (check-in streaks, achievements)
- Social features (friend lists, game invites)
- Content (weekly "hot courts" digest, court spotlights)
- Utility beyond check-ins (court info, weather, directions)

#### 4. Platform Dependency (LOW RISK)
**Risk:** Expo/React Native limitations, breaking changes

**Impact:** Development velocity slows, technical debt accumulates
**Probability:** Low (20%)

**Mitigation:**
- Keep dependencies minimal and well-maintained
- Abstract platform-specific code (easier to migrate)
- Monitor Expo/RN release notes closely
- Budget for occasional rewrites (normal in mobile)
- Consider native fallback (Swift/Kotlin) if critical

#### 5. Liability & Safety (MEDIUM RISK)
**Risk:** App facilitates in-person meetups → legal exposure if incident occurs

**Impact:** Lawsuit, negative press, regulatory scrutiny
**Probability:** Low-Medium (30%)

**Mitigation:**
- Clear Terms of Service (user assumes risk)
- Safety guidelines (meet in public, trust your instincts)
- In-app reporting (block users, report courts)
- Insurance policy (general liability, $1-2M coverage)
- Community moderation (flag inappropriate behavior)
- Partner with courts/venues (adds legitimacy)

#### 6. Competition from Big Tech (LOW RISK)
**Risk:** Google Maps adds "live activity" feature, kills Pickup

**Impact:** Existential threat, difficult to compete
**Probability:** Low (10-15%) in next 2-3 years

**Mitigation:**
- Build network effects and community (high switching cost)
- Deepen vertical integration (basketball-specific features)
- Court partnerships create B2B moat
- Consider acquisition strategy (sell to Google/Yelp/Strava)
- Speed: Move fast to establish brand before big tech notices

### Risk Matrix

```
        │  Low Impact  │  Medium Impact  │  High Impact
────────┼──────────────┼─────────────────┼──────────────
High    │              │  Fraud          │  Cold Start
Prob    │              │  Liability      │  Low Retention
────────┼──────────────┼─────────────────┼──────────────
Medium  │              │                 │
Prob    │              │                 │
────────┼──────────────┼─────────────────┼──────────────
Low     │  Platform    │  Big Tech       │
Prob    │  Dependency  │  Competition    │
```

**Priority Focus:** Cold Start, Low Retention (make-or-break risks)

---

## Roadmap & Milestones

### Pre-Launch (Weeks 1-6)

**Week 1-2: Beta Testing**
- [ ] Recruit 10-15 beta testers in Atlanta
- [ ] TestFlight (iOS) and Internal Testing (Android) distribution
- [ ] Bug bash and feedback collection
- [ ] Fix critical issues

**Week 3-4: Marketing Prep**
- [ ] Design flyers and QR codes
- [ ] Create social media accounts (Instagram, TikTok, Twitter)
- [ ] Film promo video (60-sec app demo)
- [ ] Reach out to 10 local basketball influencers
- [ ] Draft press release

**Week 5-6: Soft Launch**
- [ ] Guerrilla marketing at 5 top Atlanta courts
- [ ] Submit to App Store and Google Play
- [ ] Seed 50-100 users via personal networks
- [ ] Monitor analytics and fix critical bugs
- [ ] Iterate based on user feedback

### Phase 1: Local Domination (Months 1-6)

**Month 1: Launch**
- [ ] Public app store launch (iOS and Android)
- [ ] Press release to Atlanta sports media
- [ ] Post launch announcement on social media
- [ ] QR code campaigns at 20+ courts
- [ ] **Goal: 5,000 downloads**

**Month 2-3: Growth Hacking**
- [ ] Referral program launch
- [ ] Influencer partnerships (10+ posts)
- [ ] Court operator outreach (pitch 20 gyms)
- [ ] Community events (host 2 pickup games)
- [ ] **Goal: 10,000 downloads, 1,000 MAU**

**Month 4-6: Expansion**
- [ ] Launch in Los Angeles
- [ ] Replicate marketing playbook
- [ ] Onboard first 5 court partners
- [ ] Product iteration based on feedback
- [ ] **Goal: 25,000 downloads, 5,000 MAU**

### Phase 2: Scale (Months 7-12)

**Month 7-9: New Markets**
- [ ] Launch in NYC, Chicago, Houston
- [ ] Hire part-time community managers (1 per metro)
- [ ] Expand court partnership program
- [ ] Begin premium feature development
- [ ] **Goal: 50,000 downloads, 10,000 MAU**

**Month 10-12: Monetization Prep**
- [ ] Build premium subscription infrastructure
- [ ] Design premium feature set
- [ ] Finalize pricing strategy
- [ ] Launch beta premium program (free trial)
- [ ] **Goal: 75,000 downloads, 15,000 MAU**

### Phase 3: Monetization (Months 13-18)

**Month 13-15: Premium Launch**
- [ ] Public launch of premium subscription
- [ ] Promotional pricing for early adopters
- [ ] Email/push campaign to existing users
- [ ] A/B test pricing and feature bundles
- [ ] **Goal: 1,500+ premium subscribers**

**Month 16-18: B2B Sales**
- [ ] Launch court partnership dashboard
- [ ] Hire B2B sales rep
- [ ] Pitch 50+ venues across all metros
- [ ] Sign first 10-20 partners
- [ ] **Goal: 30+ paying venue partners, $10K MRR**

### Phase 4: Profitability (Months 19-24)

**Month 19-21: Optimization**
- [ ] Launch in-app advertising (native formats)
- [ ] Optimize conversion funnels
- [ ] Improve retention (social features, push cadence)
- [ ] Expand court partnerships to 50+ venues
- [ ] **Goal: 60K MAU, $50K MRR**

**Month 22-24: Scale & Profitability**
- [ ] Launch in 5 additional metros
- [ ] Hire full-time team (2-3 people)
- [ ] Begin adjacent sports R&D (soccer pilot)
- [ ] Explore acquisition/fundraising opportunities
- [ ] **Goal: 80K MAU, $110K MRR, break-even**

---

## Key Performance Indicators (KPIs)

### North Star Metric
**Active Check-Ins per Day** - Measures core value delivery

**Target Milestones:**
- Month 3: 50+ check-ins/day
- Month 6: 200+ check-ins/day
- Month 12: 1,000+ check-ins/day
- Month 24: 5,000+ check-ins/day

### Acquisition Metrics
- **Downloads** (App Store + Google Play)
- **Install Rate** (downloads / landing page views)
- **CAC (Customer Acquisition Cost)** - Target: <$3 per install
- **Organic vs. Paid Mix** - Target: 70% organic by Month 6

### Engagement Metrics
- **MAU (Monthly Active Users)** - Primary growth metric
- **DAU (Daily Active Users)** - Target: DAU/MAU ratio of 20-30%
- **Check-Ins per MAU** - Target: 4+ check-ins/month/user
- **Session Duration** - Target: 3-5 minutes
- **Sessions per User per Day** - Target: 1.5-2

### Retention Metrics
- **Day 1 Retention** - Target: 40%
- **Day 7 Retention** - Target: 25%
- **Day 30 Retention** - Target: 15%
- **Cohort LTV (Lifetime Value)** - Target: $20-$30 per user

### Monetization Metrics
- **Premium Conversion Rate** - Target: 10-12%
- **ARPU (Average Revenue per User)** - Target: $2-$3/month
- **Churn Rate** - Target: <5% monthly for premium
- **MRR (Monthly Recurring Revenue)** - Primary revenue metric
- **CAC:LTV Ratio** - Target: 1:5 or better

### Product Health Metrics
- **Check-In Success Rate** - Target: >95%
- **App Crash Rate** - Target: <1%
- **API Response Time** - Target: <500ms (p95)
- **Push Notification Opt-In Rate** - Target: 50%+
- **Court Data Accuracy** - Target: >90% (user-reported)

---

## Team & Organization

### Current Team
- **Solo Developer/Founder** - Full-stack development, product, design

### Hiring Plan

**Month 6-12 (Bootstrap Phase):**
- Part-time Community Manager (1 per metro, $1,500/month)
- Contract Designer (on-demand, $50/hour)
- Contract Copywriter (marketing materials, $40/hour)

**Month 13-18 (Post-Revenue):**
- Full-time Growth Marketer ($60K-$80K salary)
- Part-time Customer Support ($20/hour, 20 hours/week)
- B2B Sales Rep (commission-based, $30K base + 20% commission)

**Month 19-24 (Scale):**
- Full-time Backend Engineer ($100K-$120K salary)
- Full-time Designer ($70K-$90K salary)
- Full-time Operations Manager ($80K-$100K salary)

**Total Year 2 Headcount:** 6-7 people (mix of full-time and contract)

---

## Fundraising Strategy

### Bootstrap vs. Fundraise Decision Matrix

**Bootstrap Path (Recommended):**
- **Pros:** Full control, no dilution, forces profitability focus
- **Cons:** Slower growth, resource constraints, personal financial risk
- **Recommendation:** Bootstrap through Month 12, then decide based on traction

**Fundraise Path (If needed):**
- **Timing:** After Month 12 if growth exceeds expectations
- **Amount:** $500K-$1M seed round
- **Valuation:** $3M-$5M (based on 50K+ MAU, strong retention)
- **Use of Funds:** Marketing ($300K), team ($400K), product ($100K), reserves ($100K)

### Investor Pitch (If Pursuing Fundraising)

**Elevator Pitch:**
> "Pickup is a real-time discovery app for basketball players to find active games at nearby courts. Think Waze for pickup basketball—see who's playing right now, not just where courts are. We've built a network of 75,000 users across 5 metros with 40% 30-day retention and are launching subscriptions next month."

**Investment Highlights:**
1. **Real Problem, Proven Traction** - 75K downloads, 15K MAU, organic growth
2. **Network Effects** - More users = exponentially more value
3. **Clear Monetization** - 3 revenue streams, path to profitability
4. **Massive TAM** - 19M basketball players in US alone
5. **Experienced Team** - (Adjust based on actual team)
6. **Low CAC, High LTV** - Unit economics proven in pilot metros

**Target Investors:**
- Sports tech VCs (Courtside Ventures, KB Partners)
- Mobile consumer VCs (Kleiner Perkins, Accel)
- Basketball legends as angels (e.g., Kevin Durant, Chris Paul)
- Local Atlanta VCs (Greycroft, TechSquare Labs)

---

## Appendix

### Technology Stack Summary

**Frontend:**
- React Native 0.81.5
- Expo 54.0.32
- NativeWind 4.2.1 (Tailwind CSS)
- TypeScript 5.7.3
- Expo Router 6.0.22
- MapLibre React Native 10.4.2

**Backend:**
- Supabase (PostgreSQL + PostGIS)
- Node.js 20 (for future serverless functions)
- WeatherAPI.com

**DevOps:**
- GitHub (version control)
- Expo EAS (build service)
- Supabase CLI (migrations)

### Key Files & Locations

```
/app                           # All app screens
/src/components                # Reusable UI components
/src/services                  # Business logic & API calls
/src/types                     # TypeScript interfaces
/supabase/migrations           # Database schema versions
/assets                        # Images, icons, fonts
tailwind.config.js             # Design system config
app.json                       # Expo configuration
TEST_PLAN.md                   # QA test cases
BUSINESS_OVERVIEW.md           # This document
```

### External Resources

- **Product Design:** Figma mockups (if applicable)
- **Marketing Site:** pickup.app (to be built)
- **Support Docs:** Help center / FAQ (to be built)
- **API Docs:** Supabase API reference
- **Analytics Dashboard:** Supabase Studio + PostHog (future)

### Contact & Support

- **Founder Email:** (Add your email)
- **Support Email:** support@pickup.app (to be set up)
- **Press Inquiries:** press@pickup.app (to be set up)
- **GitHub:** (Add repo link if open source)

---

**Document Version:** 1.0
**Last Updated:** February 16, 2026
**Next Review:** March 2026 (post-beta testing)

---

## Conclusion

Pickup is a production-ready MVP with strong technical foundations, clear product-market fit potential, and multiple paths to monetization. The core differentiator—real-time activity visibility—solves a genuine pain point for millions of basketball players.

**Key Success Factors:**
1. Achieving critical mass in pilot metros (chicken & egg problem)
2. Building court operator partnerships (B2B revenue + network effects)
3. Maintaining simple, frictionless UX (no accounts, fast onboarding)
4. Executing disciplined growth marketing (guerrilla tactics + word-of-mouth)

**Next Steps:**
1. Beta testing (Weeks 1-2)
2. Marketing prep (Weeks 3-4)
3. Soft launch (Weeks 5-6)
4. Public launch (Month 1)
5. Iterate based on user feedback
6. Scale to new metros

The path to $1M+ ARR is clear. Execution is everything.
