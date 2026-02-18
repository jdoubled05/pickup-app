# Pickup Basketball App - Test Plan

## Test Environment Setup
- **Devices**: iOS physical device, Android physical device, iOS Simulator, Android Emulator
- **OS Versions**: iOS 15+, Android 10+
- **Network Conditions**: WiFi, Cellular, Offline
- **System Settings**: Light mode, Dark mode, Large text size

---

## 1. FUNCTIONAL TESTING

### 1.1 Courts List Screen

#### TC-001: Load Courts List
**Steps:**
1. Open app (first launch)
2. Navigate to Courts tab

**Expected Result:**
- Loading skeleton appears
- Courts load within 3 seconds
- Courts sorted by distance (closest first)
- Weather badges visible on cards
- Distance badges show "X mi" format

**Test Data:**
- Location permission: Granted
- Network: Connected

---

#### TC-002: Filter Courts - All/Hot/Saved
**Steps:**
1. Tap "All Courts" chip (should already be selected)
2. Tap "Hot Now" chip (if available)
3. Tap "Saved" chip (if you have saved courts)

**Expected Result:**
- Selected chip shows white text on brand red background
- List updates immediately with filtered courts
- "Hot Now" shows only courts with active check-ins
- "Saved" shows only saved courts
- Empty state appears if no results

---

#### TC-003: Advanced Filtering
**Steps:**
1. Tap "Filters" button
2. Select "Indoor" court type
3. Set max distance to 5 miles
4. Enable "Has Lighting"
5. Tap "Apply Filters"

**Expected Result:**
- Filter modal appears smoothly
- All controls are responsive
- "Apply Filters" button shows at bottom
- Modal dismisses on apply
- Courts list updates with filtered results
- Filter button shows active indicator (dot)

---

#### TC-004: Pull to Refresh
**Steps:**
1. Pull down on courts list
2. Observe basketball animation
3. Release to refresh

**Expected Result:**
- Basketball bounces and rotates during pull
- Haptic feedback on release
- Courts list reloads
- Weather data updates
- Activity counts refresh

---

#### TC-005: Swipe to Save Court
**Steps:**
1. Swipe left on any court card
2. Continue swiping until gold background appears
3. Release

**Expected Result:**
- Gold ⭐ background reveals on swipe
- Haptic feedback on action
- Court is saved
- "Saved" chip appears if first saved court
- Card returns to normal position

---

#### TC-006: Swipe to Get Directions
**Steps:**
1. Swipe right on any court card
2. Continue swiping until blue background appears
3. Release

**Expected Result:**
- Blue 🗺️ background reveals on swipe
- Haptic feedback on action
- Maps app opens with directions to court
- Returns to app when done

---

### 1.2 Court Detail Screen

#### TC-007: View Court Details
**Steps:**
1. Tap any court card from list
2. Observe court detail screen

**Expected Result:**
- Screen loads immediately
- Back button (←) visible in top left
- Court name displayed prominently
- Address shown below name
- Court type badge (Indoor/Outdoor) visible
- Hoops count displayed if available
- Lighting status shown if available
- Live activity banner shows check-in count
- "I'm Here" or check-in button visible

---

#### TC-008: Check In at Court
**Steps:**
1. On court detail, tap "🏀 I'm Here" button
2. Wait for confirmation

**Expected Result:**
- Button shows "⏳ Loading..." briefly
- Haptic feedback on tap
- Button changes to "✓ Checked In" (green background)
- Check-in count increases by 1
- Success haptic notification
- User remains checked in until they toggle off

---

#### TC-009: Check Out from Court
**Steps:**
1. While checked in, tap "✓ Checked In" button
2. Wait for confirmation

**Expected Result:**
- Button shows "⏳ Loading..." briefly
- Button returns to "🏀 I'm Here" (red background)
- Check-in count decreases by 1
- Success haptic notification

---

#### TC-010: Get Directions from Detail
**Steps:**
1. On court detail, tap "Directions" button
2. Observe maps app opens

**Expected Result:**
- Haptic feedback on tap
- Maps app launches
- Destination is the court location
- Returns to app after getting directions

---

#### TC-011: Save Court from Detail
**Steps:**
1. On court detail, tap "Save" button
2. Observe result

**Expected Result:**
- Button changes to "Saved" with gold styling
- Bookmark icon fills in
- Haptic feedback on tap
- "⭐ Saved" badge appears at top right
- Court appears in Saved Courts list

---

#### TC-012: Quick Join from Hot Court Card
**Steps:**
1. From courts list, find a hot court card (red border, "LIVE NOW")
2. Tap "🏀 Join Game" button directly on card

**Expected Result:**
- Button shows "..." briefly
- User is checked in without navigating to detail
- Button changes to "✓ Joined" (green)
- Player count increases by 1
- Success haptic feedback

---

### 1.3 Map View

#### TC-013: View Courts on Map
**Steps:**
1. Navigate to Map tab
2. Observe map loads

**Expected Result:**
- Map loads with user's location
- Court markers (📍) appear at court locations
- Hot courts have 🔥 icon on marker
- Map style matches system theme (light/dark)

---

#### TC-014: Tap Court Marker
**Steps:**
1. Tap any court marker on map
2. Observe bottom sheet appears

**Expected Result:**
- Bottom sheet slides up from bottom
- Shows court name, distance
- Shows "🔥 X players here now" if hot
- Shows court type (Indoor/Outdoor)
- "View Details" button visible

---

#### TC-015: View Details from Map
**Steps:**
1. Tap court marker
2. Tap "View Details" on bottom sheet

**Expected Result:**
- Bottom sheet dismisses
- Navigates to court detail screen
- Court detail shows correct court info

---

#### TC-016: Recenter Map
**Steps:**
1. Pan map to different location
2. Tap "Recenter" button

**Expected Result:**
- Button shows "Recentering..." briefly
- Map animates back to user location
- Button disabled during animation
- Text shows "Centered on your location"

---

#### TC-017: Refresh Map Courts
**Steps:**
1. Tap "Refresh" button

**Expected Result:**
- Button shows "Loading..." briefly
- Court markers update
- Activity counts refresh
- Button re-enables after load

---

### 1.4 Profile & Settings

#### TC-018: View Profile Info
**Steps:**
1. Navigate to Profile tab

**Expected Result:**
- App version and build number displayed
- Saved courts count matches actual saved count
- Notification settings toggle visible
- "Saved Courts" button shows count

---

#### TC-019: Toggle Notifications
**Steps:**
1. Tap notification toggle switch
2. Grant permission in system dialog (if first time)
3. Toggle switch on/off

**Expected Result:**
- System permission dialog appears (first time)
- Haptic feedback on tap
- Switch animates to on/off position
- Setting persists across app restarts

---

#### TC-020: Navigate to Saved Courts
**Steps:**
1. From Profile, tap "Saved Courts (X)" button

**Expected Result:**
- Navigates to saved courts screen
- Shows list of saved courts
- Back button works to return

---

### 1.5 Saved Courts Screen

#### TC-021: View Saved Courts List
**Steps:**
1. Navigate to Saved Courts screen (from profile or direct link)

**Expected Result:**
- Title shows "Saved Courts (X)" with count
- List shows all saved courts
- Each card shows court name, address, metadata
- "Remove" button on each card

---

#### TC-022: Navigate to Saved Court Detail
**Steps:**
1. On saved courts screen, tap any court card

**Expected Result:**
- Navigates to court detail screen
- Court detail loads correctly
- Back button returns to saved courts

---

#### TC-023: Remove Saved Court
**Steps:**
1. On saved courts screen, tap "Remove" button on a court
2. Observe result

**Expected Result:**
- Court immediately removed from list
- Count in title decreases
- If no courts remain, shows empty state
- Change persists across app restarts

---

#### TC-024: Empty State - No Saved Courts
**Steps:**
1. Remove all saved courts OR
2. Navigate to saved courts with none saved

**Expected Result:**
- Shows empty state message
- Message explains how to save courts
- No crashes or errors

---

## 2. REAL-TIME & LIVE FEATURES

### TC-025: Real-time Check-in Updates
**Steps:**
1. Open court detail screen
2. Have another user check in at same court (or use second device)
3. Observe check-in count

**Expected Result:**
- Check-in count updates immediately (within 1-2 seconds)
- Live activity banner updates
- No refresh needed
- Court card on list also updates

---

### TC-026: Receive Check-in Notification
**Steps:**
1. Enable notifications in profile
2. Have another user check in at nearby court
3. Observe notification

**Expected Result:**
- Push notification appears with "🏀 Game On!"
- Shows "X players just checked in at [Court Name]"
- Tapping notification opens court detail
- Only notifies for 1-3 player check-ins
- Max one notification per court per 5 minutes

---

### TC-027: Hot Court Badge Updates
**Steps:**
1. View courts list
2. Have first player check in at a court (or simulate)
3. Observe court card changes

**Expected Result:**
- Court card changes to HotCourtCard style
- Red border appears
- "LIVE NOW" indicator with pulsing dot
- Player count shown: "🏀 1 player here now"
- "Join Game" button appears

---

## 3. EDGE CASES & ERROR HANDLING

### TC-028: No Location Permission
**Steps:**
1. Deny location permission
2. Open app

**Expected Result:**
- App uses default location (e.g., LA)
- Shows message "Using default location"
- Courts still load for default location
- No crashes

---

### TC-029: No Internet Connection
**Steps:**
1. Turn off WiFi and cellular
2. Open app
3. Try to load courts

**Expected Result:**
- Shows error message "Failed to load courts"
- "Try Again" button appears
- Tapping retry shows same error until online
- Previously loaded data (if any) remains visible

---

### TC-030: Empty Courts List
**Steps:**
1. Set location to remote area with no courts
2. Observe result

**Expected Result:**
- Shows empty state with 📍 icon
- Message: "No courts found"
- Suggests adjusting location
- No crashes or loading loops

---

### TC-031: Invalid Court ID
**Steps:**
1. Manually navigate to /court/invalid-id (via deep link or direct entry)

**Expected Result:**
- Shows "Court not found" message
- "Back to Courts" button appears
- No crashes

---

### TC-032: Filter Results in No Courts
**Steps:**
1. Apply very restrictive filters (e.g., Indoor only, must have lighting, <1 mile)
2. Observe result

**Expected Result:**
- Shows empty state with filter emoji
- Message explains no courts match filters
- User can clear filters or adjust
- No crashes

---

### TC-033: Rapid Check-in Toggle
**Steps:**
1. On court detail, rapidly tap check-in button multiple times
2. Observe result

**Expected Result:**
- Button becomes disabled after first tap
- Shows "Loading..." state
- Subsequent taps ignored
- Final state is correct (checked in or out)
- No duplicate check-ins created

---

### TC-034: Weather API Failure
**Steps:**
1. Disable weather API key or simulate API failure
2. Load courts list

**Expected Result:**
- Courts load normally
- Weather badges simply don't appear
- No error messages shown
- No crashes

---

### TC-035: Saved Court Deleted from Database
**Steps:**
1. Save a court
2. Have court deleted from backend
3. Open Saved Courts screen

**Expected Result:**
- Loading state appears
- Invalid court automatically removed from saved list
- Only valid courts shown
- No crashes or errors

---

## 4. UI/UX TESTING

### TC-036: Light/Dark Mode Support
**Steps:**
1. Set device to light mode
2. Open app, navigate through all screens
3. Switch device to dark mode
4. Navigate through all screens again

**Expected Result:**
- All screens properly styled in both modes
- Text readable in both modes (good contrast)
- Icons visible in both modes
- Map style changes based on theme
- Tab bar colors update
- No white flashes or incorrect colors

---

### TC-037: Large Text Size (Accessibility)
**Steps:**
1. Enable largest text size in device settings
2. Open app
3. Navigate through all screens

**Expected Result:**
- Text scales appropriately
- No text cutoff or overlap
- Buttons remain tappable
- Layout adjusts gracefully
- No UI breaks

---

### TC-038: Haptic Feedback Consistency
**Steps:**
1. Enable haptics on device
2. Test all interactive elements:
   - Filter chips
   - Check-in buttons
   - Swipe gestures
   - Save buttons
   - Pull to refresh

**Expected Result:**
- Light haptic on filter chip tap
- Medium haptic on check-in tap
- Success haptic after check-in completes
- Haptic on swipe completion
- Haptic on pull-to-refresh release

---

### TC-039: Loading State Visibility
**Steps:**
1. On slow network, load each screen
2. Observe loading indicators

**Expected Result:**
- Skeleton loaders visible on courts list
- "Loading..." text on buttons during actions
- Progress clear to user
- No blank screens
- Timeout after 30 seconds with error

---

### TC-040: Smooth Animations
**Steps:**
1. Navigate between screens
2. Open/close modals
3. Scroll lists
4. Pull to refresh

**Expected Result:**
- All animations 60fps (smooth)
- No jank or stutter
- Modal slides smoothly
- Basketball bounce animation fluid
- Card press animations responsive

---

## 5. PERFORMANCE TESTING

### TC-041: Large Courts List (100+ courts)
**Steps:**
1. Set location to dense urban area
2. Load courts list with 100+ results
3. Scroll through list

**Expected Result:**
- List loads within 3 seconds
- Scroll is smooth (60fps)
- No memory issues
- Weather loads progressively
- App remains responsive

---

### TC-042: Memory Usage During Extended Session
**Steps:**
1. Use app for 30+ minutes
2. Navigate between screens repeatedly
3. Check memory usage

**Expected Result:**
- Memory usage stays under 300MB
- No memory leaks
- App doesn't slow down
- No crashes

---

### TC-043: Battery Drain Test
**Steps:**
1. Fully charge device
2. Use app for 1 hour continuously
3. Monitor battery usage

**Expected Result:**
- Battery drains <15% per hour
- App doesn't run hot
- Reasonable battery consumption
- Real-time subscriptions don't drain excessively

---

## 6. DATA PERSISTENCE TESTING

### TC-044: Saved Courts Persist
**Steps:**
1. Save 3 courts
2. Force close app
3. Reopen app

**Expected Result:**
- Saved courts count still shows 3
- All saved courts visible in saved list
- Courts remain saved

---

### TC-045: Filter Preferences Persist
**Steps:**
1. Set filters (Indoor, 10 miles, Has Lighting)
2. Apply and close filter modal
3. Force close app
4. Reopen app and check filters

**Expected Result:**
- Filter settings retained
- Filter button shows active indicator
- Opening modal shows previous selections
- Courts list already filtered

---

### TC-046: Notification Settings Persist
**Steps:**
1. Enable notifications
2. Force close app
3. Reopen app

**Expected Result:**
- Toggle still shows enabled
- Notifications still work
- Setting retained

---

## 7. INTEGRATION TESTING

### TC-047: Supabase Connection Status
**Steps:**
1. Launch app with Supabase configured
2. Check features that require Supabase

**Expected Result:**
- Check-in buttons visible
- Real-time updates work
- Activity counts display
- Notifications work

---

### TC-048: Supabase Not Configured
**Steps:**
1. Launch app without Supabase env vars
2. Check features

**Expected Result:**
- Check-in buttons hidden
- Activity features gracefully disabled
- Core features (courts list, map, saved) still work
- No crashes or errors shown

---

### TC-049: Weather API Integration
**Steps:**
1. Load courts in different locations
2. Observe weather data

**Expected Result:**
- Weather updates per location
- Correct temperatures shown
- Appropriate weather icons (☀️ ⛅ 🌧️)
- Cache prevents excessive API calls

---

## 8. ACCESSIBILITY TESTING

### TC-050: Screen Reader (VoiceOver/TalkBack)
**Steps:**
1. Enable VoiceOver (iOS) or TalkBack (Android)
2. Navigate through all screens using screen reader

**Expected Result:**
- All interactive elements announced
- Button purposes clear
- Court information read in logical order
- No unlabeled buttons or icons
- Navigation between elements works

---

### TC-051: Touch Target Sizes
**Steps:**
1. Test tapping all interactive elements
2. Verify minimum 44x44pt tap targets

**Expected Result:**
- All buttons easy to tap
- Close buttons sufficiently large
- No accidental taps on adjacent elements
- Comfortable for users with motor impairments

---

### TC-052: Color Contrast
**Steps:**
1. Review all text/background combinations
2. Test readability in both light and dark modes

**Expected Result:**
- All text clearly readable
- Minimum 4.5:1 contrast ratio for normal text
- Minimum 3:1 for large text
- No invisible or hard-to-read text

---

## 9. SECURITY & PRIVACY TESTING

### TC-053: Anonymous User IDs
**Steps:**
1. Check in at a court
2. Check AsyncStorage for user ID
3. Verify no PII stored

**Expected Result:**
- User ID is generated and stored
- ID is anonymous (no personal info)
- Check-ins associated with anonymous ID
- No tracking of personal data

---

### TC-054: Location Privacy
**Steps:**
1. Grant location permission
2. Check what location data is sent to backend

**Expected Result:**
- Only court queries use location
- Location not stored permanently
- User location not shared with other users
- Location permission can be revoked

---

## 10. CROSS-PLATFORM TESTING

### TC-055: iOS Specific Features
**Steps:**
1. Test on iPhone (physical device)
2. Verify iOS-specific behaviors

**Expected Result:**
- Safe area insets respected
- Status bar color correct
- Haptics work on supported devices
- Navigation gestures work
- No overlap with notch/Dynamic Island

---

### TC-056: Android Specific Features
**Steps:**
1. Test on Android (physical device)
2. Verify Android-specific behaviors

**Expected Result:**
- Safe area insets respected
- Status bar color correct
- Back button navigation works
- Haptics work on supported devices
- Material Design elements (if any) render correctly

---

## TEST EXECUTION CHECKLIST

### Before Testing
- [ ] Build latest version of app
- [ ] Install on test devices
- [ ] Configure test environment (API keys, location)
- [ ] Clear app data for clean slate testing
- [ ] Document device models and OS versions

### During Testing
- [ ] Execute all test cases in order
- [ ] Document any deviations from expected results
- [ ] Take screenshots of bugs
- [ ] Note device-specific issues
- [ ] Test both light and dark modes
- [ ] Test on different screen sizes

### After Testing
- [ ] Log all bugs in issue tracker
- [ ] Prioritize bugs (Critical, High, Medium, Low)
- [ ] Create bug reports with reproduction steps
- [ [ ] Verify fixes after bug resolution
- [ ] Retest failed test cases
- [ ] Sign off on test completion

---

## KNOWN LIMITATIONS (Document After Testing)

### Features Not Tested (Out of Scope)
- [ ] Deep linking from notifications
- [ ] App backgrounding/foregrounding edge cases
- [ ] Multi-user concurrent check-ins (stress testing)
- [ ] Localization/internationalization
- [ ] Tablet/iPad layouts

### Deferred Testing
- [ ] Beta testing with real users
- [ ] A/B testing of features
- [ ] Analytics validation
- [ ] Crash reporting validation

---

## SIGN-OFF

**Tested By:** ___________________
**Date:** ___________________
**Test Environment:** ___________________
**Overall Status:** [ ] Pass  [ ] Pass with Issues  [ ] Fail

**Notes:**
_____________________________________________
_____________________________________________
_____________________________________________
