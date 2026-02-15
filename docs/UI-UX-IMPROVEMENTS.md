# UI/UX Improvement Plan & Task List

This document tracks the UI/UX improvement plan for the iTrackiT Shipment Viewer. Update the checklist as work progresses so the current phase status is always visible.

## Guiding Principles
- Follow Angular 21 standalone component patterns with signals.
- Route all user-facing text through `I18nService.t()` with `en` and `zh-Hant` strings.
- Use theme tokens from `src/styles.css` (no hard-coded colors).
- Respect the two themes: **Night Bridge** (default) and **Harbour Dawn** (light).

---

## Recent Updates

### Mobile Timeline Readability Refinement (2026-02-15)

**Issue**: On mobile screens, timeline cards still felt dense (font size and detail density), and users had to scan many attributes in a single row.

**Solution Implemented**:
1. **Important-first timeline details**: Kept core fields (location, event code, location type) visible by default
2. **Vertical expandable details**: Moved secondary attributes (transport mode, vessel, voyage, status/facility/provider metadata) into a native `<details>` section
3. **Smaller mobile typography**: Reduced detail/time font sizes at 480px and 375px breakpoints
4. **No mobile horizontal card scrolling**: Enforced wrapping and `overflow-wrap` for timeline/detail content; changed port transition and milestone tracks to wrapping rows on compact screens

**Additional UI/UX Improvement Areas to Consider**:
- Add a compact/comfortable density toggle so operations teams can switch information density based on context
- Provide sticky per-card quick actions (copy event code / copy location / open raw payload) for faster triage
- Add a “critical-only” mobile filter mode to show delay, status-change, and exception events first
- Introduce skeleton loaders for timeline cards to improve perceived performance on slow devices

### Mobile Responsive Enhancements (2026-02-15)

**Issue**: Header and footer appeared narrow when zoomed out on mobile because horizontal scrolling components (Port Transition and Milestone Tracker) created a wider viewport than intended.

**Solution Implemented**:
1. **Constrained Horizontal Scrolling**: Added `max-width: 100%` to `.port-transition-track` and `.milestone-track` to ensure they don't exceed parent container width
2. **Smooth Scrolling**: Added `-webkit-overflow-scrolling: touch` and `scroll-snap-type: x proximity` for better mobile scrolling experience
3. **Visual Scroll Hints**: Added gradient overlays on the right side of scrollable containers to indicate more content
4. **Extra Small Breakpoint (375px)**: Added comprehensive responsive styles for ultra-compact mobile layouts
5. **Touch Target Improvements**: Ensured minimum touch target sizes of 32-44px for all interactive elements
6. **Aggressive Font Scaling**: Font sizes range from 0.56em to 0.9em on extra small screens for better readability

**Components Updated**:
- `src/app/app.css`: Header, footer, navigation, and action buttons
- `src/app/components/event-timeline/event-timeline.css`: Timeline, port transitions, milestones
- `src/app/components/event-summary/event-summary.css`: Summary cards and pills
- `src/app/components/event-input/event-input.css`: Input forms and buttons

**Responsive Breakpoints**:
- `1024px`: Tablet header layout (2-row grid)
- `900px`: Timeline grid stacks to single column
- `768px`: Mobile header fully stacked
- `480px`: Compact mobile layout
- `375px`: **NEW** - Ultra-compact for small screens
- `320px`: Supported via 375px styles

**Touch Target Guidelines**:
- Minimum 32x32px for small buttons (language switcher)
- Minimum 36x36px for medium buttons (theme toggle, input toggle)
- Minimum 40-44px for primary interactive elements (nav tabs, action buttons)

---

## Phase 0 — Planning & Foundations
- [x] Capture the UI/UX improvement plan and checklist (this document).
- [x] Audit current UI for accessibility gaps (contrast, ARIA, keyboard focus states).
- [x] Document design references for maritime motifs (gradients, textures, icon set).

### Accessibility Audit Notes (2026-02-12)
- Ensure focus-visible outlines are clearly visible on buttons, tabs, and links.
- Add `aria-hidden="true"` for purely decorative icons and provide labels for icon-only controls.
- Provide `role="status"` / `aria-live` regions for loading and error states where relevant.
- Validate contrast for muted text on card backgrounds across both themes.

### Maritime Motif References
- Wave-layer gradients that blend accent cyan and amber glows over deep backgrounds.
- Subtle sonar rings or compass ticks as background texture accents.
- Navigation-inspired iconography (ship, anchor, beacon, logbook) in SVG form.

## Phase 1 — Visual & Theming Enhancements
- [x] Add wave-inspired background gradients using existing CSS variables.
- [x] Refresh typography scale (Syne headings, Lexend body, JetBrains Mono code).
- [x] Replace emoji icons with themed SVGs and add hover motion (pulse/scale).
- [x] Improve responsive layout with CSS Grid/Flex and mobile accordions.
- [x] Add themed loading and error states for inputs and comparisons.
- [x] **Mobile Responsive Enhancements**: Fix viewport overflow, add 375px breakpoint, improve touch targets.

## Phase 2 — UX Flow & Accessibility
- [x] **Smooth Scrolling**: Add touch-friendly scrolling for horizontal components.
- [x] **Visual Scroll Indicators**: Add gradient hints for scrollable content.
- [x] **Touch Target Compliance**: Ensure minimum 32-44px touch targets.
- [ ] Add onboarding modal with i18n copy and dismissal persistence.
- [ ] Implement sticky header navigation for quick section access.
- [ ] Enhance hover/click affordances and keyboard interactions.
- [ ] Address WCAG compliance items from Phase 0 audit.

## Phase 3 — Priority Features (1–5)
- [ ] Interactive timeline (Gantt-style) grouped by event code.
- [ ] Map integration (Leaflet.js) for POL → POD routes.
- [ ] Filtering/search with reactive signals (keyword/date/type).
- [ ] PDF/CSV export (pdfmake or equivalent).
- [ ] Theme toggle persistence (LocalStorage).

## Phase 4 — Advanced Features (6–10)
- [ ] Real-time updates via WebSockets (if backend supports it).
- [ ] Multi-shipment dashboard with router tabs.
- [ ] Analytics view for delays and event counts.
- [ ] Comments/notes on events with form validation.
- [ ] AI insights (TensorFlow.js predictions).
