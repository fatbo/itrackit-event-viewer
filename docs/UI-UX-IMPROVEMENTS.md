# UI/UX Improvement Plan & Task List

This document tracks the UI/UX improvement plan for the iTrackiT Shipment Viewer. Update the checklist as work progresses so the current phase status is always visible.

## Guiding Principles
- Follow Angular 21 standalone component patterns with signals.
- Route all user-facing text through `I18nService.t()` with `en` and `zh-Hant` strings.
- Use theme tokens from `src/styles.css` (no hard-coded colors).
- Respect the two themes: **Night Bridge** (default) and **Harbour Dawn** (light).

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

## Phase 2 — UX Flow & Accessibility
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
- [ ] AI insights (TensorFlow.js predictions):
  - [ ] UI hooks for predictive ETA badges and delay-risk chips on timeline cards.
  - [ ] Comparison-view alerts that explain why a prediction changed (dwell spike, vessel handoff gap).
  - [ ] Toggleable “AI insights” panel describing model freshness, confidence band, and privacy note (all inference in-browser).
  - [ ] Empty/error states for when the model file is unavailable or inputs are insufficient.
