# iPad / Tablet & Responsive-Layout Strategy

_Analysis and implementation plan — no code has been changed as part of producing this document._

## Executive summary

iOS build configuration already permits iPad (`TARGETED_DEVICE_FAMILY = "1,2"`, multitasking not blocked), but nothing on the JS side is aware of it. On a real iPad the app today renders as a "blown-up iPhone app": the core reel feed uses stale, non-reactive screen-size snapshots for its paging and gesture math, has zero safe-area awareness, and roughly 300 style values across the app are phone-scale pixel constants. Android has no large-screen manifest declarations at all, and there is no tablet/idiom detection or responsive-scaling infrastructure anywhere in the codebase — the one prior attempt (`useScale.ts`) is dead code. This plan proposes building that infrastructure from scratch, fixing the reel feed's live-resize bugs, bringing safe-area handling to parity, and adding Android large-screen support — sequenced as low-risk infrastructure work first, with the one higher-risk screen (the reel feed) isolated into its own phase. Navigation-level master-detail (split view) is documented as a flagged, product-dependent follow-up, not committed work.

## Current-state findings

### Native config

- **iOS** (`ios/Preelly.xcodeproj/project.pbxproj`): `TARGETED_DEVICE_FAMILY = "1,2"` is already set on both Debug and Release — iPad builds are enabled. `UIRequiresFullScreen` is absent from `ios/Preelly/Info.plist`, which is good: it means multitasking (Split View / Slide Over / Stage Manager) is not blocked. `Info.plist`'s `UISupportedInterfaceOrientations~ipad` already allows all four orientations; iPhone stays portrait-locked (intentional, no change needed).
- **Android** (`android/app/src/main/AndroidManifest.xml`): no `<supports-screens>` tag, no explicit `android:resizeableActivity`, and no large-screen resource qualifiers (`values-sw600dp` etc.) exist anywhere under `android/app/src/main/res/`. `MainActivity` does declare `android:configChanges="keyboard|keyboardHidden|orientation|screenLayout|screenSize|smallestScreenSize|uiMode"`, which avoids activity recreation on resize/rotation — a good foundation, but there's no explicit "this app supports large screens" declaration.

### JS/runtime gaps

- **No tablet/idiom detection anywhere in `src/`.** No `Platform.isPad`, no `DeviceInfo`, no breakpoint system. `react-native-responsive-screen` (^1.4.2) is installed and used in 38 files, but it's a percentage-based width/height helper, not idiom detection. `src/presentation/hooks/useScale.ts` is the one prior attempt at a responsive helper — it is **unused anywhere in the codebase** (dead code), reads `Dimensions.get('window')` at module scope (non-reactive), and linearly scales against a 390×844 iPhone baseline, which is the wrong instinct for tablets (it would blow up a 16pt font to ~42pt on a 1024pt-wide iPad rather than give the layout more breathing room).
- **Non-reactive dimension reads dominate the core app flows.** 12 files read `Dimensions.get('window')` once at module scope and never update on rotation or on an iPad's *live* Split View / Slide Over resize:
  - `src/presentation/screens/Home/FeedScreen.tsx:44`
  - `src/presentation/components/VideoPlayer.tsx:55` (read fresh per render, but via the non-reactive API, not the hook)
  - `src/presentation/components/feed/VideoCard.tsx:8`
  - `src/presentation/screens/SplashScreen.tsx:7`
  - `src/presentation/screens/product/ProductDetailScreen.tsx:37`
  - `src/presentation/screens/product/EditProductScreen.tsx:38`
  - `src/presentation/screens/profile/UserFeedScreen.tsx:39`
  - `src/presentation/screens/onboarding/OnboardingScreen.tsx:27`
  - `src/presentation/screens/onboarding/OnboardingSlide.tsx:14`
  - `src/presentation/components/createPost/FrameScrubber.tsx:12`
  - `src/presentation/components/createPost/ThumbnailScrubber.tsx:12`
  - `src/presentation/hooks/useScale.ts:3`

  By contrast, 12 other files correctly use the reactive `useWindowDimensions()` hook — but only in secondary UI (map pickers, image carousels/grids, search result cards), not in the core reel/feed loop where it matters most.

- **`FeedScreen.tsx`'s reel feed has architecture-level, not just missing-hook, iPad problems.** Its vertically-paging `FlatList`'s `getItemLayout`/`snapToInterval` and its horizontal Trending/Following swipe-pan gesture math (clamping, thresholds) all depend on the stale `SCREEN_WIDTH`/`SCREEN_HEIGHT` module-scope constants. This breaks on a *live* resize (Split View/Slide Over drag, Stage Manager), not only on rotation. Separately, a full-bleed phone-style vertical video reel on a very wide iPad canvas wastes space and looks stretched/letterboxed unintentionally — the classic "blown-up iPhone app" complaint.
- **`ReelCard.tsx` has zero safe-area awareness.** No `useSafeAreaInsets`/`useStableSafeAreaInsets` reference at all, relying instead on fixed paddings (e.g. `paddingBottom: 85/110`, `bottom: 240`) tuned for a phone-sized bottom bar. This is notable because 48 other files across the codebase already use the established `useStableSafeAreaInsets()` hook (`src/presentation/hooks/useStableSafeAreaInsets.ts`) — the reel feed and its `TopHeader` are the outliers.
- **~300 hardcoded numeric width/height values** exist in `StyleSheet.create` calls across screens/components — mostly icon sizes, avatar/thumbnail dimensions, badges, and fixed-height bars, all phone-scale constants with no responsive scaling. Example: `src/presentation/navigation/AppNavigator.tsx:100` sizes the bottom tab bar height only by `Platform.OS === 'ios' ? 74 : 64`, never by screen size or idiom.
- **Navigation is single-column, full-screen-stack everywhere.** One flat `createNativeStackNavigator` wraps a `createBottomTabNavigator` (`AppNavigator.tsx`); every list→detail flow (search results, profile feeds, chat) is a full-screen push. No master-detail/split-view construct exists anywhere.
- **Assets are not a meaningful risk.** 43 SVG icons (via `react-native-svg`) already scale cleanly to any size/density. Only 2 raster PNGs exist in the entire app, neither with `@2x`/`@3x` variants — low priority, easy to fix in passing.

## Recommended approach

### a. Foundational responsive infrastructure

Delete `useScale.ts` — it's unused, non-reactive, and its linear-scaling approach is actively wrong for tablets. In its place, build **`src/presentation/hooks/useResponsive.ts`** on top of `useWindowDimensions()`, exposing:

```ts
{ width, height, isTablet, isLandscape, breakpoint }
// breakpoint: 'phone' | 'phoneLandscape' | 'tabletPortrait' | 'tabletLandscape'
```

- iOS idiom detection: `Platform.isPad` (free, no new dependency).
- Android idiom detection: add **`react-native-device-info`** (`DeviceInfo.isTablet()`) as a new dependency — a well-maintained, standard native module for exactly this, rather than reinventing Android tablet-detection heuristics. Combine with a 700dp-short-side width fallback for edge cases.
- Migration priority order once the hook exists: `FeedScreen.tsx` / `ReelCard.tsx` / `VideoPlayer.tsx` (core loop) → `AppNavigator.tsx` tab bar height → the other stale-`Dimensions.get` screens (`ProductDetailScreen`, `EditProductScreen`, `UserFeedScreen`) → onboarding/splash (`OnboardingScreen`, `OnboardingSlide`, `SplashScreen`) → create-post scrubbers (`FrameScrubber`, `ThumbnailScrubber`). The 12 files already using `useWindowDimensions()` correctly just need a later audit pass to standardize on the new hook — not urgent.

### b. Reel/feed screen adaptation (letterboxing-only v1)

- **Make paging math reactive.** Move `SCREEN_WIDTH`/`SCREEN_HEIGHT` out of `FeedScreen.tsx`'s module scope into `useWindowDimensions()` (or `useResponsive()`) read inside the component. `getItemLayout`, `snapToInterval`, and the `page`/`pagerRow`/`pageWrapper` styles need to derive from the live value — meaning those specific styles move from a module-scope `StyleSheet.create` to inline/`useMemo`'d styles computed per-render.
- **No separate gesture-threshold retuning needed.** The horizontal swipe-pan's `-SCREEN_WIDTH / 2` threshold is already proportional (50% of width); once `SCREEN_WIDTH` comes from the reactive hook, this is correct without further change. `SWIPE_VELOCITY_THRESHOLD` is a velocity constant (pt/s), idiom-independent — leave it fixed.
- **Letterbox video on tablet breakpoints instead of full-bleed stretching.** In `ReelCard.tsx`, wrap the `Player` (`VideoPlayer`/`VideoPlayerFullscreen`) in a centered, width-capped box on `tabletPortrait`/`tabletLandscape` breakpoints — clamp to a max aspect ratio (e.g. `min(width, height * 9/16)`) and let the existing black `container` background show as letterboxing on the sides. This mirrors how Instagram/TikTok's own tablet apps behave. `VideoPlayer`'s internal `resizeMode="cover"` and absolute-fill styling stay correct as-is; the change is entirely in `ReelCard`'s layout wrapper, not `VideoPlayer` internals.
- **A secondary content rail (comments-in-view, related listings) is explicitly out of scope for v1.** Letterboxing alone is the accepted tablet treatment for this phase; a side-rail layout is a materially larger scope item and should be a separate, explicit future decision (see Open Decisions).
- **Light type/icon scale bump on tablet only.** `ReelCard`'s text/icon sizes (e.g. `heart` fontSize 80, title fontSize 18) are fixed pt and will look proportionally smaller on a taller/wider iPad canvas. A modest +10-15% bump on `tabletPortrait`/`tabletLandscape` breakpoints is enough — not full linear scaling, and scoped only to `ReelCard`'s own text/icon styles.

### c. Safe-area consistency

Add `useStableSafeAreaInsets()` — the app's existing, established hook (already used in 48 files), not raw `useSafeAreaInsets()` — to `FeedScreen.tsx`, `ReelCard.tsx`, and `TopHeader.tsx`. Note that iPad's Stage Manager/Slide Over can introduce non-zero insets on any edge simultaneously (unlike an iPhone's simple top-xor-bottom notch/home-indicator pattern), so once wired in, apply `insets.top`/`insets.left`/`insets.right` too, not just `insets.bottom` as a phone-only implementation would.

### d. Systematic hardcoded-dimension cleanup

Triage, don't blanket-fix all ~300 values at once:

- **Tier 1 — fix now:** touch targets and primary-content sizing on high-traffic screens. Concretely: `AppNavigator.tsx:100`'s tab bar height (should become breakpoint-aware, taller on tablet per platform HIG guidance), and `ReelCard`'s action-button sizes.
- **Tier 2 — fix opportunistically:** grid/column layout containers (e.g. `ProductGridCard`/`ProductGridFeed`) — audit whether their column-count math is idiom-aware or just a percentage split that happens to look thin on a wide tablet.
- **Tier 3 — leave alone:** icon sizes inside already-scaling SVG containers/badges, small spacing/radius constants (imperceptible phone→tablet difference), and anything inside a box already capped by the letterboxing work in (b).
- **One utility, built once:** a small `scale(size, breakpointMap)` helper — an explicit per-breakpoint value map (e.g. `scale(74, { tabletPortrait: 84, tabletLandscape: 84 })`), not a continuous linear formula — built on `useResponsive()`, used only for tier 1/2 items. Explicit maps are more predictable and reviewable in PRs than a formula that silently grows everything.
- Sequence this cleanup file-by-file, in the same priority order as (a)'s migration list, only after `useResponsive()` exists.

### e. Android tablet parity

Add to `AndroidManifest.xml`:

```xml
<supports-screens
    android:largeScreens="true"
    android:xlargeScreens="true"
    android:resizeable="true"
    android:anyDensity="true" />
```

and set `android:resizeableActivity="true"` explicitly on `MainActivity` (safe given the app's min API 24 — this is what actually enables multi-window/split-screen/freeform resizing on Android tablets, Chromebooks, and foldables; today it's implicit-default rather than a stated intent).

Skip `values-sw600dp`-style resource qualifiers for now — this is a 100% RN-JS-rendered app, so native resource qualifiers wouldn't affect RN component layout (which is entirely handled by the JS-side `useResponsive()` work). Revisit only if a specific native-resource sizing issue surfaces during testing (e.g. a splash screen that looks small on a tablet). No orientation lock is needed on Android, matching the iOS choice of leaving iPad unlocked.

### f. Navigation / master-detail — flagged, lower-priority, not committed

Document (don't yet build) a `SplitViewFrame` wrapper pattern for a future phase:

- Below the `tabletLandscape` breakpoint: renders `children` unchanged — zero risk to the existing phone code path.
- At/above it: renders a list column and a detail column side by side, while the existing stack navigator still owns navigation state underneath — no navigator rewrite required, just a wrapper around specific screen pairs in `AppNavigator.tsx`.

Candidate flows (flagged for a product decision, not committed):
- `SearchResultScreen` → `ProductDetailScreen` — architecturally a strong list/detail candidate, but only worth the cost if search-then-browse is a common, extended-session flow for this marketplace app.
- Chat list → thread (`ChatNavigator`) — likely the highest-value candidate (mirrors Mail/Messages on iPad) if chat is heavily used; low implementation risk since it's a simple two-column data shape with no video/gesture complexity.
- **Not recommended:** `UserProfileScreen`/`UserFeedScreen` — this reuses the same full-bleed vertical reel pattern as the main feed, which doesn't map naturally onto a list/detail split. Stays full-screen-stack; benefits from (b)'s letterboxing work instead.
- **Not recommended:** create-post flow, payment flows, settings sub-screens — single-purpose task flows with no natural second-pane content.

This entire section is contingent on product confirming a specific flow before any engineering time is spent on it (see Open Decisions).

## Testing / verification strategy

- **Simulator/emulator device matrix:** iPad Pro 13" (largest canvas, worst-case letterboxing math), iPad mini (smallest tablet canvas, tests the breakpoint edge), iPhone 16 Pro Max + iPhone SE (phone-size boundary checks).
- **Live-resize testing is essential, not optional.** Simulate Split View / Slide Over dragging and, on iPadOS 16+, Stage Manager — these expose the module-scope `Dimensions.get` bugs that a simple rotation test would miss entirely, since they change window size *without* a full app restart or orientation change event in the traditional sense.
- **Rotate mid-scroll on the reel feed specifically** — the highest-regression-risk moment, since `getItemLayout`/`snapToInterval` must recompute without losing scroll position or breaking paging.
- **Android:** a Pixel Tablet AVD plus a resizable/foldable AVD profile, same rotation/split-screen matrix.
- **Regression guard — explicit, non-negotiable check:** a prior session fixed a real gesture-reliability bug in `ReelCard.tsx` (a `latestRef`-backed, stabilized-`useMemo` pattern for the tap/double-tap gestures, replacing a version that dropped taps on re-render). The tablet letterboxing work in (b) must not reintroduce this class of bug:
  - The `GestureDetector`'s child view's hit-testing region must stay full-bleed even when the *video* inside it is letterboxed — don't shrink the gesture-detecting view to match the video box.
  - Any new `useResponsive()` values pulled into gesture-related `useMemo`/`useCallback` closures must be added to their dependency arrays.
  - Add an explicit test case: double-tap-to-like on the letterboxed side margins on iPad, confirming the behavior is deliberate (works, or is intentionally scoped to the video box only) rather than accidental.

## Phasing / rollout

1. **Foundation** — build `useResponsive()`, add `react-native-device-info`, delete `useScale.ts`. No visible change; easy to review and revert independently.
2. **Reactive core loop** — migrate `FeedScreen.tsx` and `VideoPlayer.tsx` off stale `Dimensions.get` for paging/sizing math. Fixes a real bug on phones too (any live dimension change), so it's worth shipping and getting signal on before the riskier tablet-specific work.
3. **Safe-area parity** — add `useStableSafeAreaInsets()` to `FeedScreen`, `ReelCard`, `TopHeader`. Low risk, isolated, also improves iPhone notch/home-indicator correctness.
4. **Tablet video letterboxing** — `ReelCard.tsx`'s centered/capped video box, landed together with the gesture hit-testing regression test from the Testing section.
5. **Android native config** — `<supports-screens>` + `resizeableActivity`. Independent of the JS work; can land any time.
6. **Dimension cleanup, tier 1 only** — `AppNavigator.tsx` tab bar height + `ReelCard` action-button/text scale.
7. **Navigation split-view** — only after product confirms which flow (search or chat) gets the `SplitViewFrame` treatment; scope to exactly one flow first as a proof of concept before generalizing.
8. **Ongoing** — tier 2/3 dimension cleanup, folded opportunistically into other feature PRs that touch those screens, rather than a dedicated sweep.

## Open product/design decisions

These are not resolved by this document and need a product/design call before any related engineering work starts:

1. Should `SearchResultScreen` → `ProductDetailScreen` get a real two-pane split view on iPad landscape, or is a single-column-but-wider layout acceptable?
2. Should chat list/thread get split-view treatment? Likely the highest-value candidate architecturally, but needs a usage-pattern confirmation (is chat a heavy, extended-session surface for this app?).
3. Should the tablet reel feed eventually get a secondary content rail (comments-in-view, related listings) to use the extra width beyond letterboxing? Explicitly deferred past v1 — flagged here so it isn't forgotten, not because it's been ruled out.

## Files referenced (read-only citations — none modified in producing this document)

- `src/presentation/screens/Home/FeedScreen.tsx`
- `src/presentation/components/ReelCard.tsx`
- `src/presentation/components/VideoPlayer.tsx`
- `src/presentation/hooks/useScale.ts`
- `src/presentation/hooks/useStableSafeAreaInsets.ts`
- `src/presentation/navigation/AppNavigator.tsx`
- `android/app/src/main/AndroidManifest.xml`
- `ios/Preelly.xcodeproj/project.pbxproj`
- `ios/Preelly/Info.plist`
