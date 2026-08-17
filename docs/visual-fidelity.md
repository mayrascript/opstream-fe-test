# Visual fidelity verification

The interface is verified at three levels so a screenshot alone cannot hide a structural regression.

## 1. Measured contract

The values in [design-system.md](./design-system.md) record the exposed source properties for canvas, typography, spacing, controls, question cards, navigation, and all four task frames. Source export is disabled, so protected screenshots and assets are not committed.

## 2. Structural browser assertions

The design-contract tests cover the full desktop frame at `1440 × 1080px`, the same full composition at `1040px`, and the exact responsive boundary at `1024/1025px`. They assert the geometry and computed styles that define the composition:

- selector card position, size, padding, radius, and color;
- wizard rail, column gap, form width, top offset, question padding, input height, and action alignment;
- the full wizard composition from `1025px` and the responsive tablet composition at `1024px`;
- completion card position, width, minimum height, padding, radius, and table geometry;
- design tokens resolved by the browser rather than only declared in source.

The default positional tolerance is `±4px`, reserved for font rasterization and fractional layout. Widths, paddings, colors, and control heights with explicit source values use exact assertions.

## 3. Visual regression snapshots

Playwright covers the selector, both Software pages, Hardware with the switch state, and the summary through dedicated projects at:

- desktop: `1440 × 1080px`;
- tablet: `1024 × 900px`;
- mobile: `390 × 844px`.

Animations and save-state text are stabilized before the primary screen captures. Dedicated question-card snapshots cover saving, retrying, saved, and final-error states instead of hiding those states from visual verification. Request IDs and timestamps are not part of the visual contract. The snapshots protect the production schema-driven views; the measured contract protects their relationship to the supplied task frames.

Platform-specific macOS and Linux baselines use the same bundled Gilroy font as production and mask the platform emoji. Keeping separate references accounts only for browser text rasterization differences; it does not broaden the visual tolerance. A screenshot may differ by at most 1% of pixels at the standard pixelmatch threshold. Geometry is not delegated to that tolerance because the structural assertions above continue to enforce source coordinates and sizes directly; any Ubuntu visual difference is retained as a CI artifact for review.

## Intentional content adaptations

The source task frames use placeholder questions and four summary rows. The product requirement defines two dynamic schemas with different field counts and field types. The application therefore preserves source geometry and components while rendering the required schema labels and every submitted answer. Card height remains content-driven so errors, save states, and additional schema questions cannot be clipped.

The selector reference shows the Software selected state. The production selector intentionally starts with neither category selected so the required selection, focus transfer, and error-announcement path remains testable; the visual baseline selects Software before capture.

The source cupcake asset remains non-exportable, so the application renders the cupcake character through the platform emoji font. Gilroy is bundled from the separately supplied free-font package in its available Light and ExtraBold weights; Inter remains only the fallback. Intermediate Gilroy files such as Regular, Medium, SemiBold, and Bold were not included in that package, so the two licensed faces cover their documented weight ranges. This font-weight availability and the cupcake are the only asset-level limitations; layout and component geometry remain automated contracts.

The source's white-on-`Brand/Main` action treatment measures below WCAG AA. Primary actions therefore use the darker shared action surface (`#087965`) with white text, which measures `5.34:1`; the hover surface measures `7.21:1`. Selected controls retain the measured `Brand/Main` value. The `Brand/Green37` navigation text reaches only `2.79–2.96:1` at 14px on the source surfaces, so page labels use the accessible green `#087965` while the active rule preserves `Brand/Green37`. These adaptations are covered by axe and do not change component geometry.

The source's `#E5E5E5` editable-control border measures `1.26:1` against its white surface. Inputs and the inactive switch therefore use `#747980` to make their boundary perceptible under WCAG 1.4.11; decorative borders retain the source neutral.

## Local gate

```bash
npm run lint
npm run test:coverage
npm run build
npm run e2e
```

The gate is complete only when unit, integration, desktop/tablet/mobile E2E, axe WCAG checks, structural design assertions, and visual snapshots all pass with a clean browser console.
