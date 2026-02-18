# App Icon Design Specification
## Pickup Basketball App

### Technical Requirements
- **Size:** 1024×1024 px
- **Format:** PNG
- **Color Space:** sRGB
- **Transparency:** NO transparency allowed (iOS requirement)
- **Safe Area:** Keep important elements within 90% of canvas (allow for rounded corners)
- **File Size:** Under 1MB

---

## Design Concept

### Brand Identity
- **App Name:** Pickup
- **Tagline:** Find pickup games near you
- **Primary Color:** #960000 (Dark Red - athletic, energetic, basketball-inspired)
- **Style:** Modern, bold, athletic with subtle graffiti/street vibe

### Icon Concept Options

#### Option A: Basketball Icon (Recommended)
**Description:** Stylized basketball with location pin
- Main element: Basketball graphic (simplified, not realistic)
- Accent: Small location pin or marker integrated
- Background: Solid #960000 or subtle gradient
- Style: Flat design with subtle depth

**Why this works:**
- Instantly communicates "basketball"
- Location pin adds "nearby" context
- Simple and recognizable at all sizes
- Works well on light and dark backgrounds

#### Option B: Court from Above
**Description:** Minimalist basketball court view from above
- Show half-court with hoop and key
- Use #960000 as primary color
- White lines for court markings
- Clean, geometric design

**Why this works:**
- Unique perspective
- Instantly recognizable as basketball
- Scalable and clean at small sizes

#### Option C: "P" + Basketball
**Description:** Stylized "P" incorporating basketball elements
- Custom letterform for "P"
- Basketball texture or lines integrated
- Bold, confident design
- Can include location pin dot

**Why this works:**
- Brandable and memorable
- Works well with app name
- Modern and professional

---

## Design Guidelines

### Colors
- **Primary:** #960000 (Dark Red)
- **Accent:** #FFFFFF (White) for contrast
- **Alternative:** #000000 (Black) if needed
- **Gradient (optional):** #960000 → #C00000 for depth

### Typography (if using text)
- **Font Style:** Bold, athletic, sans-serif
- **Avoid:** Thin fonts, script fonts, small text
- **Note:** Text should be minimal or none (icons work better)

### Style Rules
- ✅ **DO:**
  - Keep it simple and bold
  - Use high contrast
  - Make it recognizable at 40×40 px
  - Test on both light and dark backgrounds
  - Use geometric shapes
  - Keep visual hierarchy clear

- ❌ **DON'T:**
  - Use gradients excessively
  - Include fine details that disappear when small
  - Use photos or realistic imagery
  - Include text smaller than icon size / 20
  - Use too many colors (2-3 max)
  - Copy other apps' icons

---

## Technical Setup

### Canvas Size
```
Width: 1024 px
Height: 1024 px
DPI: 72 (or higher)
```

### Safe Margins
iOS applies rounded corners and masking. Keep important elements:
- **Minimum safe area:** 90% of canvas (924×924 px centered)
- **Ideal safe area:** 85% of canvas (870×870 px centered)
- Center: 512, 512

### Export Settings
- Format: PNG-24
- Color Profile: sRGB IEC61966-2.1
- No transparency
- No compression artifacts

---

## Design Tools

### Option 1: Canva Pro (Easiest)
1. Create 1024×1024 px custom size
2. Use basketball graphics from library
3. Add shapes and colors
4. Export as PNG

**Pros:** No design experience needed, templates available
**Cons:** $13/month, less unique

### Option 2: Figma (Professional)
1. Free for personal use
2. More design control
3. Vector-based (scales perfectly)
4. Export at exact size

**Template:** Search Figma Community for "iOS App Icon Template"

### Option 3: Hire Designer
- **Fiverr:** $30-50 (2-3 day turnaround)
- **99designs:** $50-100 (design contest)
- **Upwork:** $50-150 (more custom)

**Tip:** Provide this spec document to designer

### Option 4: AI Tools
- **DALL-E 3** (ChatGPT Plus): Generate concept
- **Midjourney:** High quality, artistic
- **Adobe Firefly:** Vector-based options

**Prompt Example:**
```
"Minimalist app icon for basketball pickup game finder app,
flat design style, dark red #960000 background, simple basketball
graphic with location pin element, modern athletic aesthetic,
suitable for iOS app icon, no text, high contrast"
```

---

## Examples & Inspiration

### Apps with Great Icons
- **Nike Run Club:** Simple swoosh, bold brand color
- **Strava:** Minimal, recognizable symbol
- **Court Reservations:** Basketball + booking theme
- **Hoop Maps:** Basketball court finder

### Design Principles They Follow
1. **One clear focal point**
2. **Bold, simple shapes**
3. **High contrast**
4. **Brand color dominance**
5. **Recognizable at any size**

---

## File Naming
Once created, save as:
- `icon.png` (1024×1024) - for app.json
- Keep source file (PSD/Figma/AI) for future updates

---

## Next Steps

1. **Choose design approach** (Canva / Designer / AI)
2. **Create icon** following specs above
3. **Test icon:**
   - View at 40×40 px (actual size on phone)
   - Test on light background
   - Test on dark background
   - Compare to competitor apps
4. **Replace** `assets/images/icon.png`
5. **Update Android** adaptive icon files if needed

---

## Quick Start (30 min)

### DIY with Canva Pro
1. Sign up for Canva Pro (free trial)
2. Create 1024×1024 custom design
3. Add basketball graphic from library
4. Set background to #960000
5. Add location pin icon (small, corner)
6. Export as PNG
7. Done!

### Hire on Fiverr (2 days)
1. Go to Fiverr.com
2. Search "iOS app icon design"
3. Choose seller ($30-50 range)
4. Provide this spec document
5. Get 2-3 concepts
6. Request revisions if needed
7. Done!

---

## Questions?

**Q: Can I use a photo?**
A: Not recommended. Icons work best with simple graphics/illustrations.

**Q: Should I include the app name?**
A: No. The name appears below the icon on the home screen.

**Q: What about the Android icon?**
A: Create the main 1024×1024 icon first. Android adaptive icons can be created from it.

**Q: Can I change it later?**
A: Yes, but first impressions matter. Get it right before launch.

---

**IMPORTANT:** The icon is the first thing users see. Invest time/money to make it great!
