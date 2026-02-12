# UI/UX Improvement Plan & Task List

This document tracks the UI/UX improvement plan for the iTrackiT Shipment Viewer. Update the checklist as work progresses so the current phase status is always visible.

## Guiding Principles
- Follow Angular 21 standalone component patterns with signals.
- Route all user-facing text through `I18nService.t()` with `en` and `zh-Hant` strings.
- Use theme tokens from `src/styles.css` (no hard-coded colours).
- Respect the two themes: **Night Bridge** (default) and **Harbour Dawn** (light).

---

## Phase 0 — Planning & Foundations
- [x] Capture the UI/UX improvement plan and checklist (this document).
- [ ] Audit current UI for accessibility gaps (contrast, ARIA, keyboard focus states).
- [ ] Document design references for maritime motifs (gradients, textures, icon set).

## Phase 1 — Visual & Theming Enhancements
- [ ] Add wave-inspired background gradients using existing CSS variables.
- [ ] Refresh typography scale (Syne headings, Lexend body, JetBrains Mono code).
- [ ] Replace emoji icons with themed SVGs and add hover motion (pulse/scale).
- [ ] Improve responsive layout with CSS Grid/Flex and mobile accordions.
- [ ] Add themed loading and error states for inputs and comparisons.

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
- [ ] AI insights (TensorFlow.js predictions).
