# iTrackiT Shipment Viewer

An Angular frontend application for viewing and comparing ocean shipment event timelines. This support tool allows users to visualize shipment events, view detailed timelines, and compare multiple shipments side by side.

## Features

### 1. JSON Input
- Paste JSON data directly into a textarea
- Upload JSON files from your computer
- Support for switching between primary and secondary events for comparison
- Auto-loads demo data on startup so users can explore the UI immediately

### 2. Shipment Summary
- Displays key shipment metadata: shipment ID, BL number, booking number, container number, size/type, ISO code, shipment type, shipping line, origin (POL), destination (POD), and source
- **Seal Numbers** — shown as blue tags (🔒) for each seal on the container
- **Dangerous Goods (DG) Indicator** — an orange `⚠ DG` pill badge appears in the header when DG codes are present; individual codes are listed in an orange-highlighted row
- **Damage (DMG) Indicator** — a red `🔴 DMG` pill badge appears in the header when damages are reported; individual damage entries are listed in a red-highlighted row
- Shows total event count and the first/latest event timestamps

### 3. Port Transition Map
- Visual port-to-port route showing the container's journey
- Supports multiple transhipment ports (POT), not just origin and destination
- Displays arrival and departure times at each port with estimated/planned time badges

### 4. Event Timeline
- Chronological display of all equipment events grouped by date
- Visual timeline with contextual icons for each event type (🚢 departure, 📦 loaded, 📭 unloaded, 🚪 gate, etc.)
- **Time grouping** — when the same event has Actual, Estimated, and Planned times they are displayed together in a single card
- Detailed information for each event: location, facility, vessel/voyage, transport mode, container status, and data provider
- Clickable date index for quick navigation

### 5. Event Comparison
- Load two different shipments for side-by-side comparison
- Automatic detection of key differences (carrier, origin, destination, event count)
- Visual comparison of event counts and timelines
- **Info/Warning Alerts** — the Alerts tab surfaces notifications based on comparison rules:
  - **Info alerts (actual event detection)**: triggered when the **secondary** shipment contains Actual events at:
    - **POL**: IG / OG / VD
    - **POD**: VA / IG / OG
  - **Warning alerts (threshold-based)**:
    - **POL VD change** — Estimated VD time differs by the configured threshold (default 24h) when there is **no Actual VD** at POL.
    - **POD VA change** — Estimated VA time differs by the configured threshold (default 24h) when there is **no Actual VA** at POD.
    - **Transhipment count change** — number of unique POT ports differs between shipments.
  - Thresholds are configurable in the Alerts tab (POL VD hours / POD VA hours).
  - **Limitations**: alerts are heuristics derived from event codes, location types, and available estimated/actual timestamps. They do **not** infer root cause, carrier responsibility, or guarantee completeness; missing data or completed actual events suppress warnings, and route alerts only compare the count of unique POT ports (not the exact ports or sequence).

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm (v9 or higher)

### Installation

```bash
npm install
```

### Development Server

Run the development server:

```bash
npm start
```

Navigate to `http://localhost:4200/`. The application will automatically reload if you change any of the source files.

### Build

Build the project for production:

```bash
npm run build
```

The build artifacts will be stored in the `dist/` directory.

### Running Tests

```bash
npm test
```

## Usage

### Demo Data

The application loads a rich demo shipment on startup. The demo covers:

- **Transhipment route** — Yantian (CN) → Singapore (SG) → Jeddah (SA) → Rotterdam (NL)
- **Multiple seal numbers** on the container
- **Dangerous goods codes** (DG class/UN number pairs)
- **Damage reports** on the container
- **Mixed time types** — Actual times for completed legs, Estimated and Planned times for future legs
- **Vessel changes** — first leg on one vessel, second and third legs on another after transhipment

Clear the demo with the "Clear Demo" button in the input panel to load your own data.

### JSON Data Format

The application supports two JSON formats:

#### 1. OpShipmentEventRaw Format (OpenAPI Spec)

The primary format based on the OnePort HK Smart Tracker Collector OpenAPI specification:

```json
{
  "id": "1234567890",
  "version": 1,
  "eventId": "a1b2c3d4-e5f6-7890-1234-567890abcdef",
  "source": "oneport",
  "blNo": "AMQ0325766",
  "bookingNo": "BOOK0325766",
  "shippingLine": "CMDU",
  "containerNo": "SZLU9011734",
  "containerSize": "40",
  "containerType": "HC",
  "shipmentType": "TS",
  "containerISOCode": "42G1",
  "sealNo": ["CMA22309", "SEAL12345"],
  "dg": ["3/1234", "8/2809"],
  "dmg": ["DENT-LEFT", "SCRATCH-ROOF"],
  "pol": {
    "unLocationCode": "CNYTN",
    "unLocationName": "Yantian, CN",
    "facilityName": "YANTIAN INTERNATIONAL CONTAINER TERMINAL"
  },
  "pod": {
    "unLocationCode": "NLRTM",
    "unLocationName": "Rotterdam, NL",
    "facilityName": "APM TERMINALS ROTTERDAM"
  },
  "equipmentEvents": [
    {
      "eventCode": "AL",
      "eventName": "Loaded on Vessel",
      "locationType": "POL",
      "eventTime": "2025-02-18T10:30:00+08:00",
      "timeType": "A",
      "containerStatus": "F",
      "modeOfTransport": "Ocean",
      "conveyanceInfo": {
        "conveyanceName": "CMA CGM ZHENG HE",
        "conveyanceNumber": "0FA51S1MA"
      },
      "location": {
        "unLocationCode": "CNYTN",
        "unLocationName": "Yantian, CN"
      }
    }
  ],
  "transportEvents": [
    {
      "seq": 1,
      "eventCode": "VD",
      "eventName": "Vessel Departure",
      "locationType": "POL",
      "eventTime": "2025-02-18T14:00:00+08:00",
      "timeType": "A",
      "modeOfTransport": "Ocean",
      "conveyanceInfo": {
        "conveyanceName": "CMA CGM ZHENG HE",
        "conveyanceNumber": "0FA51S1MA"
      },
      "location": {
        "unLocationCode": "CNYTN",
        "unLocationName": "Yantian, CN"
      }
    }
  ]
}
```

**Key Features of OpShipmentEventRaw Format:**
- **Event Grouping**: Equipment events are automatically grouped by event type, location, and location type
- **Multiple Time Types**: Events can have Actual (A), Estimated (E), or Planned (G) times, displayed together
- **Event Codes**: Standard event codes (AL, UV, OG, IG, VD, VA, etc.) with human-readable names
- **Detailed Location**: Location information includes facility codes, names, and UN location codes
- **Container Status**: Equipment events include container status (Full/Empty)
- **Seal Numbers**: Array of seal identifiers on the container (`sealNo`)
- **Dangerous Goods**: Array of DG class/UN number codes (`dg`)
- **Damages**: Array of damage descriptions (`dmg`)
- **Transhipment**: Use `locationType: "POT"` for ports of transhipment to build multi-leg routes

See `public/sample-opshipmenteventraw.json` for a complete example.

#### 2. Legacy ShipmentData Format

The simplified legacy format for backward compatibility:

```json
{
  "shipmentId": "SHIP-12345",
  "bookingNumber": "BOOK-67890",
  "containerNumber": "CONT-11111",
  "carrier": "Ocean Carrier Inc.",
  "origin": "Shanghai, China",
  "destination": "Los Angeles, USA",
  "events": [
    {
      "eventType": "Container Gate In",
      "eventDateTime": "2024-01-15T08:30:00Z",
      "location": "Shanghai Port",
      "description": "Container received at port",
      "status": "Completed"
    },
    {
      "eventType": "Vessel Departure",
      "eventDateTime": "2024-01-16T14:00:00Z",
      "location": "Shanghai Port",
      "description": "Vessel departed from origin port",
      "vessel": "MV Ocean Star",
      "voyage": "V123",
      "status": "Completed"
    }
  ]
}
```

The application automatically detects which format is being used and processes it accordingly.

### Steps to Use

1. **Load Primary Event**:
   - Paste JSON data into the textarea or upload a JSON file
   - Click "Load JSON" to process the data

2. **View Event Details**:
   - The Event Summary section displays key shipment information
   - The Event Timeline shows all events in chronological order

3. **Compare Events** (Optional):
   - Click the toggle button to switch to "Secondary Event"
   - Load a second shipment's JSON data
   - The Event Comparison section will show side-by-side comparison

4. **Clear Data**:
   - Click "Clear All" to reset and start over

## Project Structure

```
src/
├── app/
│   ├── components/
│   │   ├── event-input/        # Input component for JSON data
│   │   ├── event-summary/      # Summary display component
│   │   ├── event-timeline/     # Timeline visualization component
│   │   └── event-comparison/   # Comparison component
│   ├── models/
│   │   └── shipment-event.model.ts  # TypeScript interfaces
│   ├── services/
│   │   ├── event-data.ts       # Shared data service
│   │   └── shipment-parser.ts  # Parser for OpShipmentEventRaw → ShipmentData
│   ├── app.ts                  # Root component
│   └── app.html                # Root template
└── styles.css                  # Global styles
```

## Technology Stack

- **Angular 21**: Modern web framework with standalone components and signals
- **TypeScript**: Type-safe development
- **CSS3**: Styling and animations

## License

This project is part of the iTrackiT support tools suite.
