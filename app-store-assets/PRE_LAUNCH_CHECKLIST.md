# Pre-Launch Checklist
## Pickup Basketball App - iOS App Store Submission

**Last Updated:** February 18, 2026

---

## ✅ Completed

- [x] **App Development** - Core features implemented
- [x] **Screenshots** - 5 perfect screenshots (1320×2868)
- [x] **App Store Listing Copy** - Complete draft ready
- [x] **Privacy Policy Template** - Created and ready to customize
- [x] **Test Data** - Demo check-ins working
- [x] **Light/Dark Mode** - Fully supported
- [x] **Icons** - Using Ionicons (professional)
- [x] **Photo Upload** - Working with proper permissions

---

## 🎨 In Progress

- [ ] **App Icon** - Being designed on Fiverr
  - Waiting for: 1024×1024 PNG from designer
  - When received: Replace `assets/images/icon.png`
  - Then run: `npx expo prebuild --clean`

---

## ⏳ To Do Before Submission

### Critical (Required)

#### 1. App Icon
- [ ] Receive icon from Fiverr designer
- [ ] Verify it's 1024×1024 px, no transparency
- [ ] Replace `assets/images/icon.png`
- [ ] Update Android adaptive icons (if provided)
- [ ] Rebuild: `npx expo prebuild --clean`
- [ ] Test on device to verify icon appears

#### 2. Privacy Policy
- [ ] Customize [PRIVACY_POLICY_TEMPLATE.md](PRIVACY_POLICY_TEMPLATE.md)
- [ ] Fill in your contact email
- [ ] Fill in your company name
- [ ] Host at `yourwebsite.com/privacy` OR use:
  - https://www.termsfeed.com (free generator)
  - https://www.iubenda.com (paid, GDPR compliant)
- [ ] Add URL to App Store Connect

#### 3. Support Contact
Choose one:
- [ ] Create support email: `support@yourapp.com`
- [ ] Or use existing email
- [ ] Or create simple support page

#### 4. App Store Connect Account
- [ ] Sign up at https://developer.apple.com
- [ ] Pay $99/year developer fee
- [ ] Verify identity (takes 1-2 days)
- [ ] Create App Store Connect account
- [ ] Create app record in App Store Connect

#### 5. Build & Upload
- [ ] Create production build: `eas build --platform ios`
- [ ] Upload to App Store Connect
- [ ] Submit for TestFlight (optional but recommended)
- [ ] Test via TestFlight on real device

### Important (Strongly Recommended)

#### Testing
- [ ] Test on physical iPhone (not just simulator)
- [ ] Test all core features:
  - [ ] View nearby courts
  - [ ] Check in/out
  - [ ] View court details
  - [ ] Upload photo
  - [ ] Save/unsave courts
  - [ ] Get directions
  - [ ] Pull to refresh
- [ ] Test in different locations
- [ ] Test with/without location permission
- [ ] Test with/without camera permission
- [ ] Test edge cases:
  - [ ] No internet connection
  - [ ] No nearby courts
  - [ ] Empty states

#### Content
- [ ] Review app description for typos
- [ ] Verify screenshots show best features
- [ ] Check all URLs are correct
- [ ] Proofread everything

#### Legal
- [ ] Review privacy policy with lawyer (optional but wise)
- [ ] Add copyright notice
- [ ] Review Apple's guidelines: https://developer.apple.com/app-store/review/guidelines/

### Nice to Have (Optional)

#### Marketing
- [ ] Create landing page (yourapp.com)
- [ ] Set up social media (@pickupapp)
- [ ] Prepare launch announcement
- [ ] Plan launch strategy

#### Analytics & Monitoring
- [ ] Set up analytics (Expo Analytics / Mixpanel / Amplitude)
- [ ] Set up error tracking (Sentry)
- [ ] Set up performance monitoring

#### Additional Testing
- [ ] Beta test with friends (TestFlight)
- [ ] Get feedback from target users
- [ ] Fix critical bugs before launch

---

## 📋 App Store Connect Submission Checklist

When you're ready to submit:

### App Information
- [ ] App name: "Pickup"
- [ ] Subtitle: "Find pickup games near you"
- [ ] Category: Sports
- [ ] Age rating: 4+
- [ ] Privacy policy URL
- [ ] Support URL

### Version Information
- [ ] Version: 1.0.0
- [ ] Build: [from EAS Build]
- [ ] Copyright: "2026 [Your Name/Company]"
- [ ] What's New: Version 1.0 release notes

### Pricing & Availability
- [ ] Price: Free
- [ ] Countries: United States (start), expand later
- [ ] Release: Manual or Automatic after approval

### App Review Information
- [ ] Contact email
- [ ] Contact phone
- [ ] Demo account (if needed): N/A (no login required)
- [ ] Notes for reviewer:
  ```
  This app helps users find basketball courts and see live activity.
  No account required. Location permission needed to show nearby courts.
  To test: Allow location, check "Hot Now" filter for live courts.
  ```

### Screenshots
- [ ] Upload 5 screenshots to correct device size (6.9" display)
- [ ] Verify order (most important first)
- [ ] Add captions if desired

---

## 🚀 Launch Timeline

**Estimated timeline from now:**

1. **Wait for icon** - 1-3 days (Fiverr designer)
2. **Integrate icon + privacy policy** - 1 day
3. **Final testing** - 1-2 days
4. **Create EAS build** - 1 hour
5. **Upload to App Store Connect** - 1 hour
6. **App review** - 1-7 days (usually 24-48 hours)
7. **LAUNCH!** 🎉

**Total:** 5-14 days from today

---

## 📞 Support Resources

### Apple Developer
- **App Store Connect:** https://appstoreconnect.apple.com
- **Review Guidelines:** https://developer.apple.com/app-store/review/guidelines/
- **Human Interface Guidelines:** https://developer.apple.com/design/human-interface-guidelines/

### Expo
- **EAS Build Docs:** https://docs.expo.dev/build/introduction/
- **App Store Submission:** https://docs.expo.dev/submit/ios/

### Your Documentation
- [APP_STORE_LISTING.md](APP_STORE_LISTING.md) - Complete listing copy
- [PRIVACY_POLICY_TEMPLATE.md](PRIVACY_POLICY_TEMPLATE.md) - Customizable policy
- [APP_ICON_SPEC.md](APP_ICON_SPEC.md) - Icon specifications
- [SCREENSHOT_CHECKLIST.md](SCREENSHOT_CHECKLIST.md) - Screenshot guide

---

## ✨ After Launch

Once approved and live:

- [ ] Announce on social media
- [ ] Share with friends/family
- [ ] Monitor reviews and ratings
- [ ] Respond to user feedback
- [ ] Track analytics
- [ ] Plan next features
- [ ] Consider Android launch

---

## 🆘 Need Help?

**Stuck on something?**
1. Check Expo docs
2. Search Apple Developer forums
3. Ask in Expo Discord
4. Review this checklist again

**Common issues:**
- Build failures → Check `npx expo-doctor`
- App rejected → Read rejection carefully, address issues
- TestFlight issues → Verify bundle ID and provisioning

---

**You're almost there!** 🏀

Once you get the icon from Fiverr, you're basically ready to submit. The hardest parts are done:
- ✅ App is built and working
- ✅ Screenshots are perfect
- ✅ Listing copy is written
- ✅ Privacy policy template ready

Just need to:
1. Get the icon
2. Create privacy policy page
3. Build and upload
4. Submit for review

**Good luck with your launch!** 🚀
