# Feature Roadmap & Improvement Proposals

This document outlines proposed enhancements to the iTrackiT Shipment Viewer based on analysis of the current shipment data model (`OpShipmentEventRaw`) and UI capabilities. For the dedicated UI/UX task checklist, see [docs/UI-UX-IMPROVEMENTS.md](UI-UX-IMPROVEMENTS.md).

---

## Implemented Features

### 1. Shipment Type Labels
**Problem:** The shipment type field displays raw codes (`IM`, `EX`, `TS`) which are not immediately recognisable to users unfamiliar with shipping terminology.

**Solution:** Map codes to human-readable labels with i18n support:
| Code | English | 繁體中文 |
|------|---------|----------|
| IM | Import | 進口 |
| EX | Export | 出口 |
| TS | Transhipment | 轉運 |

**Impact:** Improves readability for non-technical users viewing the Shipment Summary.

### 2. Container Weight Display
**Problem:** The `containerWeight` field exists in the data model but is never displayed in the UI. Weight is a critical attribute for logistics planning and compliance.

**Solution:** Display container weight in the Shipment Summary grid with formatted units (kg).

### 3. Voyage Progress Indicator
**Problem:** Users must mentally piece together the shipment's progress from individual events. There is no at-a-glance indicator of how far along the journey the container is.

**Solution:** A computed progress percentage based on the ratio of completed transport events (those with Actual times) to total transport events, displayed as a progress bar in the Shipment Summary.

### 4. Location-Type Color Coding on Timeline Cards
**Problem:** All timeline event cards share the same cyan left-border, making it difficult to quickly distinguish between events at the Port of Loading, Port of Discharge, and Transhipment ports.

**Solution:** Apply distinct left-border accent colours based on `locationType`:
| Location Type | Colour | Meaning |
|---------------|--------|---------|
| POL | Emerald (green) | Origin port events |
| POD | Coral (red) | Destination port events |
| POT | Amber (yellow) | Transhipment port events |
| POC / other | Cyan (default) | Port of call / other |

### 5. Vessel Change Detection at Transhipment
**Problem:** In transhipment shipments the container is moved between different vessels, but this change is not visually highlighted. Users must manually compare vessel names across events.

**Solution:** Detect vessel changes between consecutive legs in the Port Transition map and display a vessel-change badge showing the new vessel name.

### 6. Transport Event Count in Summary
**Problem:** The "Total Events" count only reflects equipment events, but transport events (vessel departures/arrivals) are equally important.

**Solution:** Display both equipment and transport event counts separately in the summary.

### 7. Dwell Time Calculation
**Problem:** Users had no visibility into how long a container remains at each port. Long dwell times may indicate delays, congestion, or customs holds.

**Solution:** Calculate and display the time a container spends at each port (arrival to departure) in the Port Transition map. Ports with dwell time ≥ 48 hours are highlighted with an amber alert to draw attention to potential delays.

**Implementation:** The `portTransition` computed signal now calculates `dwellTimeHours` for each port node that has both arrival and departure times. The dwell time is displayed as a compact badge below the port times.

### 8. ETA Accuracy Tracking
**Problem:** When both Estimated and Actual times exist for the same event, there was no way to see the variance between them. Users could not tell whether a vessel arrived on time, early, or late.

**Solution:** When both Actual and Estimated times are available for the same equipment event, the timeline card now displays the variance:
- **Green** (< 2 hrs): On time
- **Amber** (2–12 hrs): Moderate deviation
- **Red** (> 12 hrs): Significant deviation

**Implementation:** The `getEtaVariance()` method computes the difference and returns a colour-coded label. Displayed inline on each timeline card that has both time types.

### 9. Smart Event Type Classification (Milestone Tracker)
**Problem:** Users must read through all individual timeline events to understand the shipment's overall journey progress. There is no summary of which major milestones have been reached.

**Solution:** A milestone tracker displayed above the timeline that groups events into three phases:
- **Origin Milestones**: Gate In (IG) → Loaded (AL) → Vessel Departure (VD) at POL
- **Transit Milestones**: Vessel Arrival → Vessel Departure at each POT
- **Destination Milestones**: Vessel Arrival (VA) → Unloaded (UV) → Gate Out (OG) at POD

Each step shows a coloured dot (emerald for origin, amber for transit, coral for destination) that fills in when the corresponding Actual event is recorded.

**Implementation:** The `milestones` computed signal dynamically builds the milestone list from equipment and transport events. It checks for actual events at each milestone and marks them as completed.

### 10. UI/UX Visual Refresh (Phase 1)
**Problem:** The UI relied on emoji icons and had limited visual depth or mobile affordances.

**Solution:** Introduced themed SVG iconography, wave-inspired background gradients, typography scale adjustments, and mobile-friendly accordion navigation for the timeline index. Added themed loading and error states for the input and comparison panels.

### 11. Layout Redesign with ui-ux-pro-max Design System
**Problem:** The original layout had a separate header and navigation bar taking up vertical space. The header stacked vertically on mobile, and only had a single responsive breakpoint at 900px. There were no visible keyboard focus states or reduced-motion support.

**Solution:** Applied [ui-ux-pro-max](https://github.com/nextlevelbuilder/ui-ux-pro-max-skill) design system guidelines to redesign the app layout:
- **Unified toolbar** — merged the header and navigation into a single sticky top bar using CSS Grid (brand | nav | actions) for a cleaner dashboard-style layout
- **Sticky header** — the top bar stays visible while scrolling for constant access to navigation
- **Improved responsive design** — three breakpoints (768px, 1024px, 1440px) instead of one, with progressive layout adaptation
- **Keyboard accessibility** — added `:focus-visible` outlines for all interactive elements
- **Reduced motion** — added `prefers-reduced-motion` media query to disable animations for users who prefer it
- **Better visual hierarchy** — tighter spacing, consistent transitions, and proper `margin-top: auto` footer placement

---

## Future Proposals

### Multi-Container View
Support loading multiple containers from the same BL, displaying a summary table and allowing drill-down into individual container timelines.

> **Deferred:** Requires additional data fields (multi-container BL structure) not yet present in the model.

### Reefer Temperature Trend Chart
When multiple temperature readings are available over time, display a sparkline or mini chart showing the temperature trend alongside the required range.

> **Deferred:** Requires multiple temperature readings over time; current model only stores a single reading.

### Export / Share
Allow users to export the current view as PDF or share a read-only link for collaboration with colleagues.

> **Deferred:** Requires PDF generation library and/or backend service for shareable links.

### Carrier Performance Analytics
Aggregate ETA accuracy data across shipments to provide carrier-level statistics, showing which carriers consistently deliver on time and which are frequently delayed.

> **Rationale:** Industry demand for carrier reliability metrics. Builds on ETA Accuracy Tracking (Feature 8). Requires multi-shipment data aggregation.

### Port Congestion Indicator
Use dwell time data to flag ports that consistently have long dwell times, indicating potential congestion or operational issues.

> **Rationale:** Builds on Dwell Time Calculation (Feature 7). Industry-standard logistics intelligence.

### CO₂ Emission Estimation
Estimate carbon emissions for each leg based on transport mode, distance, and vessel type. Display total carbon footprint in the shipment summary.

> **Rationale:** Growing regulatory and ESG reporting requirements in the shipping industry (IMO 2030/2050 targets).

### Customs & Compliance Status Tracking
Track customs clearance milestones at each port, including customs hold status, inspection flags, and estimated clearance times.

> **Rationale:** Common industry requirement for import/export compliance visibility. Would need additional event codes or data fields.

### Smart Notification Rules
Allow users to configure notification rules (e.g., "alert me if vessel departure is delayed by more than 6 hours") that generate alerts automatically.

> **Rationale:** Proactive monitoring is a core industry need. Builds on existing comparison/alert architecture.
