# ABYSSALFLOW: PROJECT CONTEXT & SYSTEM INSTRUCTIONS

## 1. Project Summary & Vibe

**AbyssalFlow** is a gamified, minimalist menstrual cycle and activity tracker built with React Native and Expo Router. The app uses a strict "Abyssal" deep-ocean design language with minimal UI chrome—think dark, immersive, contemplative.

**Design Philosophy:**
- Heavy use of dark blues (#04122B, #143867) for backgrounds
- Light blue waves (#64B5F6) as a signature visual separator
- Glowing white moon motifs as primary UI element
- Minimalist interactions: most functionality is gesture-driven (swipe, rotate, tap)
- No clunky buttons or standard mobile UI patterns—everything feels like an ocean interface
- Typography: Georgia serif for headings (feels elegant), monospace for metadata
- Color restraint: keep the palette within the blue/white spectrum; no jarring accent colors

The app is designed to feel calm and reflective, not busy. Every animation should have weight and intention.

---

## 2. Tech Stack & Dependencies

**Core Framework:**
- **React Native** 0.81.5
- **Expo Router** ~6.0.23 (file-based routing with /(tabs) layout groups)
- **React** 19.1.0
- **TypeScript** ~5.9.2 (strict mode for type safety)

**Key Animation & UI Libraries:**
- **expo-linear-gradient** ~15.0.8 (for smooth color transitions)
- **react-native-svg** ^15.15.4 (for custom wave shapes and vector graphics)
- **expo-haptics** ~15.0.8 (tactile feedback on calendar dial interactions)
- **Animated** (React Native built-in, NOT Reanimated—we prefer native Animated for performance)
- **PanResponder** (React Native built-in for gesture tracking)

**Navigation & Icons:**
- **@react-navigation/native** ^7.1.8
- **@react-navigation/bottom-tabs** ^7.4.0
- **@expo/vector-icons** ^15.0.3 (Ionicons for tab navigation)

**Other Utilities:**
- **expo-constants** ~18.0.13
- **expo-font** ~14.0.11
- **react-native-gesture-handler** ~2.28.0 (for native gesture support)
- **react-native-screens** ~4.16.0 (performance optimization for navigation)

**Note:** react-native-reanimated is installed but should only be used if explicitly required. Default to native Animated API.

---

## 3. Current File Structure

```
app/
├── _layout.tsx                 # Root Stack layout (handles routes, modal presentation)
├── index.tsx                   # Login redirect page
├── register.tsx                # User registration flow
├── modal.tsx                   # Generic modal template
├── landing1.jsx                # Onboarding: nickname input
├── landing2.jsx                # Onboarding: birth year selector (year picker)
├── landing3.jsx                # Onboarding: purpose disclosure
├── landing4.jsx                # Onboarding: period rhythm (regular/irregular)
├── landing5.jsx                # Onboarding: health history (PCOS, endometriosis, etc.)
├── landing6.jsx                # Onboarding: doctor visits frequency
└── (tabs)/                     # Tabbed navigation layout
    ├── _layout.tsx             # Tab configuration (Dashboard, Calendar, Stats)
    ├── dashboard.tsx           # MAIN: Circular Calendar Dial + moon visualization
    ├── calendar.tsx            # Calendar grid view (planned, not fully built)
    └── history.tsx             # Historical stats/trends (planned, not fully built)

components/
├── AbyssalBackground.tsx       # CORE: Three-layer background wrapper (gradient, moon layer, wave layer)
├── WaveBackground.tsx          # Onboarding background (wave gradient + static stars ✦)
├── haptic-tab.tsx              # Wrapper for tab button haptic feedback
├── themed-text.tsx             # Reusable styled Text component
├── themed-view.tsx             # Reusable styled View component
├── parallax-scroll-view.tsx    # Scroll view with parallax effect
├── external-link.tsx           # Link component wrapper
├── hello-wave.tsx              # Utility wave animation component
└── ui/
    ├── collapsible.tsx         # Collapsible panel component
    ├── icon-symbol.tsx         # Icon symbol abstraction
    └── icon-symbol.ios.tsx     # iOS-specific icon symbol

constants/
└── theme.ts                    # Color palette and font definitions (Light/Dark mode)

hooks/
├── use-color-scheme.ts         # Detect device light/dark mode preference
├── use-color-scheme.web.ts     # Web-specific color scheme
└── use-theme-color.ts          # Get theme-aware colors

assets/
└── images/
    └── abyssal-logo.png        # App logo

scripts/
└── reset-project.js            # Reset project to clean state
```

---

## 4. Core Components & Logic (The "Hard Stuff")

### 4.1 AbyssalBackground Component
**File:** `components/AbyssalBackground.tsx`

This is the signature UI wrapper that enables the "moon behind the wave" effect. It uses three layered Views with careful z-index and elevation management:

```
Layer 1 (zIndex: 0):
  - LinearGradient (#04122B → #143867) 
  - Fills top 50% of screen with dark blue gradient
  - Sets the "sky" for the moon

Layer 2 (zIndex: 1):
  - middleLayer prop (typically the moon dial) 
  - Positioned behind the wave
  - This is where the Circular Calendar Dial lives

Layer 3 (zIndex: 50, elevation: 50):
  - SVG-rendered wave using Cubic Bézier curve: 
    M 0,90 C ${x*0.3},-30 ${x*0.7},210 ${x},90 L ${x},180 L 0,180 Z
  - pointerEvents="none" to allow touches to pass through
  - marginTop: -120 creates overlap effect so wave slides over the moon
  - Wave gradient from #64B5F6 (light blue) → #215A88 (dark blue)
```

**Critical Implementation Details:**
- The negative marginTop (-120) on the Wave Layer is **essential**—it creates the illusion of the wave sliding in front of the moon
- `pointerEvents="none"` on the wave ensures touches reach interactive elements below
- contentLayer (zIndex: 100) wraps all interactive children and stays clickable
- Both `zIndex` and `elevation` must be set for Android compatibility

**Do Not Change:**
- The wave SVG path formula (Bézier cubic curve)
- The color values (#04122B, #143867, #64B5F6, #215A88)
- The marginTop offset or z-index hierarchy
- The pointerEvents settings

---

### 4.2 Circular Calendar Dial (Dashboard)
**File:** `app/(tabs)/dashboard.tsx`

This is the most complex component in the app. It renders a circular calendar where days are positioned around a moon using trigonometry, and users can rotate the wheel to navigate months/days.

#### Key Variables:
```
MOON_SIZE = width * 0.7              // Moon diameter (70% of screen width)
WRAPPER_SIZE = width * 1.4           // Wrapper is 2x the moon (contains day circles)
DAY_CIRCLE_RADIUS = MOON_SIZE/2 + 35 // Radius of the day circle positions
angleSlice = 360 / daysInMonth       // Each day gets this many degrees (360/30 ≈ 12°)
```

#### Animation & Gesture Logic:

1. **Initial State:**
   - Calculates the current day and month
   - Sets `initialRotationAngle = -(currentDay - 1) * angleSlice`
   - This positions the current day at the "top" of the dial

2. **PanResponder Gesture Tracking:**
   - `onStartShouldSetPanResponder()` → Returns `true` to capture the gesture
   - `onPanResponderGrant()` → User touches the dial:
     - Stops any active animation immediately
     - Saves current rotation as offset: `rotationAngle.setOffset(currentAngleRef.current)`
     - Resets animation value to 0
     - Clears inactivity timer
   - `onPanResponderMove()` → User drags:
     - Applies rotational speed multiplier (0.5 for smooth, "heavy" feel)
     - `rotationAngle.setValue(gestureState.dx * 0.5)`
   - `onPanResponderRelease()` → User lifts finger:
     - Calculates snap-to-grid angle: `Math.round(currentAngleRef.current / angleSlice) * angleSlice`
     - Springs back to nearest day: `Animated.spring()` with tension: 60, friction: 8
     - Triggers inactivity timer reset

3. **Haptic Feedback (Mechanical Clicks):**
   - Adds listener to `rotationAngle` animated value
   - On each `angleSlice` boundary crossed, fires `Haptics.impactAsync(ImpactFeedbackStyle.Light)`
   - Creates tactile "stepping" feel as user rotates
   - Last recorded tick prevents duplicate haptics

4. **5-Second Inactivity Timeout:**
   - `startInactivityTimer()` clears and restarts a 5-second timer
   - On timeout, `resetToToday()` springs the dial back to current day
   - Provides auto-reset behavior without annoying the user

5. **Live Angle Tracking (Critical):**
   - `currentAngleRef` is a mutable ref that tracks the exact rotation angle in real-time
   - Updated via `rotationAngle.addListener()` callback
   - Used in `onPanResponderRelease()` to calculate accurate snap-to-grid
   - **Why:** Animated values can "jump" when stopping and setting offset—the ref prevents this

#### Day Positioning (Trigonometry):
```javascript
for (let day = 1; day <= daysInMonth; day++) {
  const angle = (day - 1) * angleSlice - 90;  // Offset by -90 for top positioning
  const radians = (angle * Math.PI) / 180;
  const x = Math.cos(radians) * DAY_CIRCLE_RADIUS;
  const y = Math.sin(radians) * DAY_CIRCLE_RADIUS;
  
  // Each day is rendered at (x, y) with a rotation transform
  // So text rotates to point outward from center
}
```

#### Interpolation:
```javascript
const rotateInterpolate = rotationAngle.interpolate({
  inputRange: [-3600, 3600],      // Allow 10 full rotations
  outputRange: ["-3600deg", "3600deg"],
});

// Applied via: transform: [{ rotate: rotateInterpolate }]
```

**Do Not Change:**
- The PanResponder logic (it's finely tuned)
- The spring tension/friction values without testing (they create the "feel")
- The trigonometric math for day positioning
- The `currentAngleRef` pattern (it solves critical animation bugs)
- The haptic style (`ImpactFeedbackStyle.Light`) without redesigning the interaction

**Safe to Customize:**
- `rotationSpeed` multiplier (currently 0.5)
- Inactivity timeout duration (currently 5000ms)
- Day circle radius offset (currently +35)
- Haptic intensity (if needed)

---

### 4.3 WaveBackground Component (Landing Pages)
**File:** `components/WaveBackground.tsx`

Used on all landing pages (landing1–6) and login/register screens. Renders an SVG wave gradient + 5 decorative stars.

**Star Positions (Fixed):**
```javascript
const STARS = [
  { top: 60, left: 28, size: 14, opacity: 0.9, rotate: "10deg" },
  { top: 110, left: 48, size: 8, opacity: 0.7, rotate: "0deg" },
  { top: 40, left: 220, size: 10, opacity: 0.85, rotate: "-8deg" },
  { top: 180, left: 300, size: 12, opacity: 0.6, rotate: "5deg" },
  { top: 140, left: 80, size: 6, opacity: 0.6, rotate: "0deg" },
];
```

**Wave Gradient:**
```
#0a1929 (top, 0%)   → Deep abyss
#1a4d6d (40%)       → Mid ocean
#2a6b8d (70%)       → Lighter blue
#4a9bb8 (100%)      → Wave crest
```

**Implementation:**
- SVG with `preserveAspectRatio="none"` to stretch across device width/height
- Three wave layers (main gradient, overlay at 0.6 opacity, overlay at 0.4 opacity)
- Stars rendered as Text components with ✦ Unicode character
- Each star has unique opacity + rotation for depth variation

**Consistency Rule:**
- Never change the STARS array positions or colors—they're tested across devices
- The gradient is the visual signature of the app

---

## 5. Developer Preferences & Rules

### 5.1 Animation
- **Default to native `Animated` API** from React Native (simple, performant)
- Do NOT use Reanimated unless explicitly asked or performance testing shows necessity
- All animations should have defined durations and easing (avoid jarring instant changes)
- Gesture-driven animations should feel "weighty"—use spring physics with moderate tension/friction

### 5.2 Styling & Color Palette
- **Core Colors (Never change these):**
  - Deep Blue (Sky): `#04122B`
  - Medium Blue (Horizon): `#143867`
  - Light Blue (Wave): `#64B5F6`
  - Dark Wave: `#215A88`
  - Deep Abyss: `#0a1929`
  
- **Accent Colors (Use sparingly):**
  - White: `#FFFFFF`
  - Light Text: `#E1F2FF`
  - Glowing Blue: `#6DB4D8`

- Keep text contrast high for readability
- Avoid bright neon or warm colors (reds, oranges, yellows)—they break the ocean vibe

### 5.3 Z-Index & Pointer Events
- **Critical Pattern for Adding UI Over AbyssalBackground:**
  ```
  <AbyssalBackground middleLayer={<YourComponent />}>
    <View style={{ zIndex: 100, pointerEvents: "box-none" }}>
      {/* Your top-level interactive UI goes here */}
    </View>
  </AbyssalBackground>
  ```
  
- Always set `pointerEvents="box-none"` on parent containers so touches reach children
- Never place interactive elements directly on the wave layer (zIndex: 50)
- Use `elevation` property for Android z-index compatibility

### 5.4 Gesture Interactions
- Always use `PanResponder` for drag/swipe interactions (not Gesture Handler)
- Provide haptic feedback on significant user actions (day selection, snap-to-grid)
- Animations should respond immediately to user input—no lag

### 5.5 File Organization
- Landing pages use `.jsx` (JavaScript, untyped)
- Core app uses `.tsx` (TypeScript)
- Components should be named descriptively (e.g., `CircularCalendarDial`, not `Wheel`)
- Keep component files under 300 lines—split larger components into sub-components
- Use absolute imports: `@/components/...`, `@/hooks/...`, etc.

### 5.6 TypeScript & Type Safety
- Use strict TypeScript mode
- Define Props interfaces for all components
- Avoid `any` types—use `unknown` with proper type guards
- Use React.FC for function component typing

### 5.7 Performance
- Memoize animated components with `React.memo()` if re-rendering is heavy
- Use `useCallback` for listeners and event handlers (especially in gesture logic)
- Avoid creating new Animated.Value instances on every render
- Test on low-end Android devices (Animated is more CPU-intensive than GPU animations)

### 5.8 Testing & Debugging
- Use `console.log()` sparingly—rely on React Native debugger
- Test on both iOS and Android simulators
- Check landscape orientation support if UI is flexible
- Haptic feedback must be tested on device (simulator doesn't support it)

---

## 6. Current State & Next Steps

### What's Built ✅
1. **Onboarding Flow** (landing1–6): User enters nickname, birth year, period rhythm, health conditions, and doctor visit frequency. All pages use WaveBackground with static stars.

2. **Dashboard Tab with Circular Calendar Dial**: The centerpiece—users rotate a gesture-controlled moon dial to navigate days of the current month. Haptic feedback on day changes, auto-reset to today after 5 seconds of inactivity.

3. **Navigation Structure**: Root Stack with /(tabs) layout. Landing pages are full-screen pre-tab routes. Tab navigation routes to Dashboard, Calendar (stub), and History/Stats (stub).

4. **Design System**: AbyssalBackground wrapper, WaveBackground for onboarding, custom color palette, consistent font hierarchy.

5. **Auth Bypass**: Redirect in index.tsx allows skipping login during dev (easily removed).

### What's Partially Built 🔄
- Calendar tab (UI template exists, no functionality)
- History/Stats tab (UI template exists, no data aggregation)
- Database/State Management (not yet implemented)

### What's NOT Built ❌
- Backend API integration (cycle predictions, sync)
- Persistent data storage (AsyncStorage or database)
- Symptom logging UI
- Historical trend calculations
- Settings/Profile screens
- Export/Share functionality

---

### NEXT IMMEDIATE GOAL (For You to Fill In)

What's your priority for the next development session?

```
[ Describe your specific next goal here ]

Examples:
- "Build the calendar grid view and wire it to show days with logged symptoms"
- "Implement AsyncStorage to persist user profile and cycle data"
- "Design the symptom logging popup that appears on day tap"
- "Create API integration layer for backend sync"
```

---

## Quick Reference: Common Tasks

### Adding a New Component Over AbyssalBackground
1. Create component with props interface (TypeScript)
2. Define styles at bottom of file
3. Wrap in `<View zIndex={100} pointerEvents="box-none">`
4. Pass to `AbyssalBackground middleLayer` prop
5. Test z-index layering on both platforms

### Modifying Calendar Dial Behavior
1. Adjust `rotationSpeed` in `onPanResponderMove` for sensitivity
2. Modify spring tension/friction in `onPanResponderRelease` for feel
3. Change inactivity timeout in `startInactivityTimer` (default 5000ms)
4. Update `angleSlice` logic if adapting to weeks or custom intervals

### Adding a New Onboarding Page
1. Copy `landing1.jsx` as template
2. Update import paths and function name
3. Replace content, keep WaveBackground import and structure
4. Add router.push() navigation to next page
5. Add back button with `router.back()`

### Deploying Color Changes
1. Update `constants/theme.ts` and component-level style sheets
2. Never hardcode colors in components (import from theme or use constants)
3. Test in both light and dark modes
4. Verify contrast ratios for accessibility

---

**Version:** 1.0 (May 3, 2026)  
**Last Updated:** Project context document created for Google AI Studio handoff  
**Maintainer:** React Native + Expo specialist
