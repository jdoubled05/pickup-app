# 🧪 Testing Guide - Phase 1 MVP

Quick guide to test the app with your 529 real courts and verify all features work.

---

## 🚀 Getting Started

### 1. Start the App
```bash
# Terminal 1: Start Metro bundler
npm start

# Terminal 2: Run on iOS simulator
npm run ios

# Or Android
npm run android
```

### 2. Verify Environment
Check that your `.env` file has correct Supabase credentials:
```
EXPO_PUBLIC_SUPABASE_URL=your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

---

## ✅ Feature Testing Checklist

### Courts List Screen (Tab 1)

**Expected Behavior:**
- [ ] Screen title shows "Courts"
- [ ] Subtitle shows "Find basketball courts near you" (no debug labels)
- [ ] Courts list loads automatically
- [ ] Shows real court data (529 courts in Atlanta area)
- [ ] Courts display name, address, and metadata
- [ ] "Saved Courts (X)" button appears at top
- [ ] Pull to refresh works

**What to Test:**
1. Launch app - should land on Courts tab
2. Wait for courts to load (2-3 seconds)
3. Verify courts appear with real names (e.g., "Piedmont Park Basketball Courts")
4. Pull down to refresh - list should reload
5. Check for any debug text - should be NONE

**Red Flags:**
- ❌ "Mock data" or "Live data" labels visible
- ❌ Coordinates/radius debug info visible
- ❌ No courts loading (check Supabase connection)
- ❌ Error messages

---

### Court Detail Screen

**Expected Behavior:**
- [ ] Tap any court to open detail view
- [ ] Court name displays as large heading
- [ ] Address shows below name
- [ ] Metadata shows: Indoor/Outdoor • X hoops • Lighting
- [ ] "Get Directions" button appears
- [ ] Check-in section shows "X people here now"
- [ ] "I'm Here" button appears
- [ ] "Save" / "Saved" button appears
- [ ] No debug labels visible

**What to Test:**
1. Tap a court from the list
2. Verify all court details display
3. Tap "Get Directions"
   - Should open Apple Maps (iOS) or Google Maps (Android)
   - Verify location is correct
4. Tap "I'm Here" button
   - **FEEL** for vibration/haptic (medium strength)
   - Button should change to "I'm Here ✓"
   - Count should increment by 1
   - Should feel success vibration after ~1 second
5. Tap "I'm Here ✓" again to undo
   - Should feel vibration
   - Button reverts to "I'm Here"
   - Count decrements by 1
6. Tap "Save" button
   - Should feel light vibration
   - Button changes to "Saved"
7. Tap "Saved" to unsave
   - Should feel light vibration
   - Button reverts to "Save"

**Red Flags:**
- ❌ "Mock data" / "Live data" labels visible
- ❌ Get Directions doesn't open maps
- ❌ No haptic feedback when pressing buttons
- ❌ Check-in doesn't persist (refresh and check)
- ❌ Count doesn't update in real-time

---

### Saved Courts Screen

**Expected Behavior:**
- [ ] Accessible from courts list "Saved Courts (X)" button
- [ ] Shows only courts you've saved
- [ ] Count matches number of saved courts
- [ ] Can unsave from this screen

**What to Test:**
1. Save 2-3 courts from court detail
2. Navigate to Saved Courts
3. Verify only saved courts appear
4. Unsave one - should disappear from list
5. Go back to Courts list - saved count should update

**Red Flags:**
- ❌ Saved courts don't persist after app restart
- ❌ Count doesn't match actual saved courts

---

### Profile Tab

**Expected Behavior:**
- [ ] Shows "Profile" heading
- [ ] Shows app version
- [ ] Shows "Saved Courts" with count (NO DUPLICATE)
- [ ] Shows "Account: Coming soon"

**What to Test:**
1. Tap Profile tab
2. Verify no duplicate "Saved Courts" cards
3. Verify saved count matches actual saved courts

**Red Flags:**
- ❌ Duplicate cards visible
- ❌ Saved count is wrong

---

## 🔥 Real-Time Check-Ins Test

**Multi-Device Test (If Available):**

1. Open app on TWO devices (or simulator + physical device)
2. Both navigate to the SAME court
3. Device 1: Tap "I'm Here"
   - Device 1 should show "1 person here now"
   - Device 2 should automatically update to "1 person here now" (within ~2 seconds)
4. Device 2: Tap "I'm Here"
   - Both should show "2 people here now"
5. Device 1: Tap "I'm Here ✓" to undo
   - Both should show "1 person here now"

**Expected:** Real-time updates without refreshing.

**Red Flags:**
- ❌ Updates don't appear on other device
- ❌ Have to refresh to see changes
- ❌ Count gets out of sync

---

## 📱 Haptic Feedback Test

**Note:** Haptics only work on **physical devices**, not simulators.

**Test on iPhone or Android Phone:**

1. Navigate to any court detail
2. Tap "I'm Here" button
   - **Feel:** Medium vibration immediately
   - **Feel:** Success vibration after check-in completes (~1 sec)
3. Tap "Save" button
   - **Feel:** Light vibration

**Expected Haptic Strength:**
- Check-in press: Medium (noticeable)
- Check-in success: Distinct "success" pattern (iOS only)
- Save/unsave: Light (subtle)

**Red Flags:**
- ❌ No vibration at all (check device settings)
- ❌ Vibration too strong/weak
- ❌ Vibration on simulator (should not happen)

---

## 🌍 Location Test

**Change Location in Simulator:**

iOS Simulator:
1. Features → Location → Custom Location
2. Enter coordinates for different city (e.g., NYC: 40.7128, -74.0060)
3. Refresh courts list
4. Should show "No courts found near you"

**Why:** Your 529 courts are all in Atlanta area. Changing location should show no results.

---

## ⚠️ Error Scenarios

**Test error handling:**

1. **Network Off**
   - Turn off WiFi/cellular
   - Refresh courts list
   - Should show error message (not crash)

2. **Invalid Court ID**
   - Manually navigate to `/court/invalid-id`
   - Should show "Court not found" (not crash)

3. **Rapid Check-In Toggle**
   - Tap "I'm Here" multiple times rapidly
   - Should not create duplicate check-ins
   - UI should stay consistent

---

## 📊 Database Verification

**Check Data in Supabase Dashboard:**

1. Go to Supabase Dashboard → Table Editor → `check_ins`
2. Perform a check-in in the app
3. Refresh table - should see new row
4. Verify:
   - `court_id` matches the court
   - `anonymous_user_id` is a unique device ID
   - `expires_at` is ~3 hours from now
5. Wait 3+ hours (or manually delete) - check-in should expire

---

## ✅ Success Criteria

**Phase 1 MVP is ready if:**

- ✅ All 529 courts load successfully
- ✅ No debug labels visible anywhere
- ✅ Get Directions opens maps app correctly
- ✅ Check-ins work with real-time updates
- ✅ Haptic feedback works on physical device
- ✅ Save/unsave persists across app restarts
- ✅ No crashes or errors during normal use
- ✅ Profile tab has no duplicates
- ✅ UI looks clean and professional

---

## 🐛 Found an Issue?

**Report Issues:**

1. **What happened:** Describe the unexpected behavior
2. **Steps to reproduce:** How to trigger the issue
3. **Expected vs Actual:** What should happen vs what did happen
4. **Device info:** iOS/Android, version, simulator/physical
5. **Screenshots:** If applicable

**Common Issues:**

| Issue | Likely Cause | Fix |
|-------|--------------|-----|
| Courts don't load | Supabase connection | Check `.env` file |
| No haptics | Using simulator | Test on physical device |
| Check-ins don't update | Realtime not enabled | Run verification query from migration docs |
| Saved courts lost | AsyncStorage issue | Check device storage permissions |

---

## 🎯 Next Steps After Testing

**If all tests pass:**
1. Share app with 2-3 beta testers
2. Collect feedback on UX/UI
3. Identify most-requested features
4. Prioritize Phase 2 features

**If issues found:**
1. Document issues
2. Prioritize by severity
3. Fix critical bugs before beta testing
4. Re-test after fixes

---

## 📞 Need Help?

**Quick Debug Commands:**

```bash
# Check Metro bundler logs
npm start

# Clear cache and restart
npm start -- --reset-cache

# Check Supabase connection
# Open app, check console logs for Supabase errors

# Verify migrations ran
# Run verification queries from MIGRATION_STRATEGY.md
```

**Database Diagnostic:**
```sql
-- Check court count
SELECT COUNT(*) FROM courts;

-- Check check_ins exist
SELECT * FROM check_ins WHERE expires_at > now();

-- Verify realtime enabled
SELECT tablename FROM pg_publication_tables
WHERE pubname = 'supabase_realtime' AND tablename = 'check_ins';
```

---

**Happy Testing! 🏀**
