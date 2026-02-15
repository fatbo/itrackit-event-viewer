# AI Prediction MVP Plan

Phased tasks to ship on-device TensorFlow.js predictions with minimal risk.

## Scope
- Predictive ETA adjustments and delay-risk flags for future events (no new backend).
- Pure browser inference with TensorFlow.js; models shipped as static assets.
- Demo-enabled via default sample shipment.

## Task Breakdown
- [x] Add TensorFlow.js runtime dependency and security check.
- [x] Implement AIInsightsService to generate per-event predictions with a lightweight TF.js model.
- [x] Attach AI predictions to parsed shipment data (events + timeline metadata).
- [x] Surface predictive ETA + risk badges in the timeline with i18n strings.
- [x] Update demo/sample shipment to showcase predictive badges on load.
- [x] Add unit tests for AIInsightsService and run existing suite.
- [ ] Capture UI screenshot after integration.

## Implementation Notes
- Use a tiny dense model with fixed weights (no training in-browser) to keep bundle impact low.
- Features: baseline leg duration, recent dwell time, provider priority; output is delay adjustment hours + confidence.
- Risk bands: low (<2h), medium (2–6h), high (>6h) adjusted delay.
- Fallbacks: if insufficient data, keep predicted time equal to estimated/planned time and mark as low-risk with low confidence.
