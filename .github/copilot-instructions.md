DISTILLED_AESTHETICS_PROMPT = """
<frontend_aesthetics>
You tend to converge toward generic, "on distribution" outputs. In frontend design, this creates what users call the "AI slop" aesthetic. Avoid this: make creative, distinctive frontends that surprise and delight. Focus on:

Typography: Choose fonts that are beautiful, unique, and interesting. Avoid generic fonts like Arial and Inter; opt instead for distinctive choices that elevate the frontend's aesthetics.

Color & Theme: Commit to a cohesive aesthetic. Use CSS variables for consistency. Dominant colors with sharp accents outperform timid, evenly-distributed palettes. Draw from IDE themes and cultural aesthetics for inspiration.

Motion: Use animations for effects and micro-interactions. Prioritize CSS-only solutions for HTML. Use Motion library for React when available. Focus on high-impact moments: one well-orchestrated page load with staggered reveals (animation-delay) creates more delight than scattered micro-interactions.

Backgrounds: Create atmosphere and depth rather than defaulting to solid colors. Layer CSS gradients, use geometric patterns, or add contextual effects that match the overall aesthetic.

Avoid generic AI-generated aesthetics:
- Overused font families (Inter, Roboto, Arial, system fonts)
- Clichéd color schemes (particularly purple gradients on white backgrounds)
- Predictable layouts and component patterns
- Cookie-cutter design that lacks context-specific character

Interpret creatively and make unexpected choices that feel genuinely designed for the context. Vary between light and dark themes, different fonts, different aesthetics. You still tend to converge on common choices (Space Grotesk, for example) across generations. Avoid this: it is critical that you think outside the box!
</frontend_aesthetics>
"""

## Project Rules for AI Agents

### Architecture & Conventions
- **Angular 21** with standalone components and signals (no NgModules)
- **Vitest** for testing (not Jasmine/Karma). Use `toBe(true)` not `toBeTrue()`
- **CSS variables** defined in `src/styles.css` — always use `var(--accent-*)` tokens
- **i18n**: All user-facing text must go through `I18nService.t()` with both `en` and `zh-Hant` translations
- **Theming**: Two themes ("Night Bridge" dark default, "Harbour Dawn" light) via `[data-theme]` attribute
- **Fonts**: Syne (display), Lexend (body), JetBrains Mono (code) — loaded from Google Fonts

### Data Model
- Primary format: `OpShipmentEventRaw` (OpenAPI spec) with `equipmentEvents` and `transportEvents`
- Legacy format: `ShipmentData` with flat `events` array
- Parser (`ShipmentParser`) converts raw → display format; auto-detected via `isOpShipmentEventRaw()`
- Equipment events are grouped by `eventCode + unLocationCode + locationType`
- Time types: `A` (Actual), `E` (Estimated), `G` (Planned)
- Location types: `POL` (Loading), `POD` (Discharge), `POT` (Transhipment), `POC` (Call)

### Development Workflow
- Build: `npx ng build`
- Test: `npx ng test --watch=false`
- Dev server: `npx ng serve`
- Install: `npm install`
- All tests must pass before committing
- Angular font inlining is disabled (`optimization.fonts: false`) — do not enable

### When Adding New Features
1. Check if the feature can be implemented with the existing `OpShipmentEventRaw` model
2. If additional data fields are needed, document the feature in `docs/FEATURES.md` under "Future Proposals" and defer
3. Add i18n translations for both `en` and `zh-Hant` locales
4. Add unit tests consistent with existing patterns (TestBed for components, direct instantiation for services)
5. Use CSS variables for all colours — never hardcode colour values
6. Use Angular signals and computed properties for reactive state
7. Update `docs/FEATURES.md` and `README.md` after completing work

### Post-Task Procedures
After completing any development task:
1. Run `npx ng test --watch=false` to verify all tests pass
2. Run `npx ng build` to verify the build succeeds
3. Update `docs/FEATURES.md` — move completed proposals to "Implemented Features"
4. Update `README.md` with any new user-facing features
5. Consider whether additional features can be proposed based on industry best practices
