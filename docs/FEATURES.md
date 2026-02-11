# Feature Roadmap & Improvement Proposals

This document outlines proposed enhancements to the iTrackiT Shipment Viewer based on analysis of the current shipment data model (`OpShipmentEventRaw`) and UI capabilities.

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

---

## Future Proposals

### Smart Event Type Classification
Introduce a higher-level "milestone" classification that groups raw event codes into user-friendly categories:
- **Origin Milestones**: Gate In (IG) → Loaded (AL) → Vessel Departure (VD)
- **Transit Milestones**: Vessel Arrival at POT → Unloaded → Loaded → Vessel Departure
- **Destination Milestones**: Vessel Arrival (VA) → Unloaded (UV) → Gate Out (OG)

This would allow a compact milestone tracker at the top of the timeline.

### Dwell Time Calculation
Calculate and display the time a container spends at each port (arrival to departure). Long dwell times could trigger amber/red alerts, helping users identify potential delays.

### ETA Accuracy Tracking
When both Estimated and Actual times exist for the same event, compute the variance and surface it:
- *"Vessel arrived 4.2 hrs later than estimated"*
- Colour-code: green (< 2 hrs), amber (2-12 hrs), red (> 12 hrs)

### Multi-Container View
Support loading multiple containers from the same BL, displaying a summary table and allowing drill-down into individual container timelines.

### Reefer Temperature Trend Chart
When multiple temperature readings are available over time, display a sparkline or mini chart showing the temperature trend alongside the required range.

### Export / Share
Allow users to export the current view as PDF or share a read-only link for collaboration with colleagues.
