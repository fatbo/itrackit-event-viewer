# iTrackiT Shipment Viewer

An Angular frontend application for viewing and comparing ocean shipment event timelines. This support tool allows users to visualize shipment events, view detailed timelines, and compare multiple shipments side by side.

## Features

1. **JSON Input**: 
   - Paste JSON data directly into a textarea
   - Upload JSON files from your computer
   - Support for switching between primary and secondary events for comparison

2. **Event Summary**:
   - Display key shipment information (shipment ID, booking number, container number, etc.)
   - Show total event count
   - Display first and last event details

3. **Event Timeline**:
   - Chronological display of all shipment events
   - Visual timeline with icons for different event types
   - Detailed information for each event (location, vessel, voyage, status)

4. **Event Comparison**:
   - Load two different shipments for side-by-side comparison
   - Automatic detection of key differences
   - Visual comparison of event counts and timelines

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

## Usage

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
  "containerSize": "45",
  "containerType": "r1",
  "shipmentType": "IM",
  "containerISOCode": "45RT",
  "pol": {
    "unLocationCode": "CNYTN",
    "unLocationName": "Yantian, CN",
    "facilityName": "YANTIAN INTERNATIONAL CONTAINER TERMINAL"
  },
  "pod": {
    "unLocationCode": "HKHKG",
    "unLocationName": "Hong Kong, CN",
    "facilityName": "HONG KONG INTERNATIONAL TERMINAL"
  },
  "equipmentEvents": [
    {
      "eventCode": "AL",
      "eventName": "Loaded on Vessel",
      "locationType": "POL",
      "eventTime": "2025-02-20T10:30:00+08:00",
      "timeType": "A",
      "containerStatus": "F",
      "modeOfTransport": "Ocean",
      "conveyanceInfo": {
        "conveyanceName": "CNC CHEETAH",
        "conveyanceNumber": "0XW80S1NC"
      },
      "location": {
        "unLocationCode": "CNYTN",
        "unLocationName": "Yantian, CN"
      }
    }
  ],
  "transportEvents": [
    {
      "eventCode": "VD",
      "eventName": "Vessel Departure",
      "locationType": "POL",
      "eventTime": "2025-02-20T14:00:00+08:00",
      "timeType": "A",
      "modeOfTransport": "Ocean",
      "conveyanceInfo": {
        "conveyanceName": "CNC CHEETAH",
        "conveyanceNumber": "0XW80S1NC"
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
│   │   └── event-data.ts       # Shared data service
│   ├── app.ts                  # Root component
│   └── app.html                # Root template
└── styles.css                  # Global styles
```

## Technology Stack

- **Angular 21**: Modern web framework
- **TypeScript**: Type-safe development
- **RxJS**: Reactive programming
- **CSS3**: Styling and animations

## License

This project is part of the iTrackiT support tools suite.