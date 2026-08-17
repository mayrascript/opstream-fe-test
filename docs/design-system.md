# Design system contract

This document is the implementation contract for the request-form interface. It was measured from the supplied read-only design library and task frames on 2026-08-12. The source disables asset export and value copying, so this repository contains no protected source assets. Values below are limited to properties exposed by the inspector or verified from the rendered frames.

## Foundations

### Color roles

| Design role         | CSS token                      | Value                  | Usage                                 |
| ------------------- | ------------------------------ | ---------------------- | ------------------------------------- |
| `States/bg`         | `--ds-canvas`                  | `#F6F6F7`              | Full-viewport application canvas      |
| `Mono/White`        | `--ds-surface`                 | `#FFFFFF`              | Cards and controls                    |
| `Mono/Dark1`        | `--ds-text-primary`            | `#26292D`              | Headings, labels, and primary content |
| `Mono/Dark2`        | `--ds-text-secondary`          | `#50545A`              | Supporting content                    |
| `Mono/Dark3`        | `--ds-text-tertiary`           | `#747980`              | Secondary descriptions                |
| `Mono/Gray2`        | `--ds-text-muted`              | `#95999F`              | Inactive metadata                     |
| `Mono/Gray3`        | `--ds-border`                  | `#E5E5E5`              | Chip, navigation, and button borders  |
| Accessible boundary | `--ds-control-border`          | `#747980`              | Editable controls and inactive switch |
| `Mono/Gray4`        | `--ds-surface-subtle`          | `#F8F8F8`              | Subtle hover surfaces                 |
| `Brand/Main`        | `--ds-brand-main`              | `#1DB496`              | Primary actions and selected controls |
| `Brand/Green37`     | `--ds-brand-strong`            | `#1AA287`              | Active navigation rule                |
| `Brand/Light`       | `--ds-brand-light`             | `#F2FDFB`              | Selected chip surface                 |
| Active navigation   | `--ds-brand-nav`               | `rgb(19 136 112 / 5%)` | Current page surface                  |
| Accessible action   | `--ds-action-background`       | `#087965`              | Primary button surface                |
| Action hover        | `--ds-action-background-hover` | `#066352`              | Primary button hover surface          |
| Action text         | `--ds-action-text`             | `#FFFFFF`              | Primary button text                   |
| Navigation text     | `--ds-navigation-text`         | `#087965`              | Accessible green page labels          |
| Accessible error    | `--ds-error`                   | `#B42318`              | Validation and final save failures    |
| Error surface       | `--ds-error-soft`              | `#FEF0ED`              | Invalid input surface                 |

The exact `States/Red` value is not exposed in read-only mode. The implemented error color is an explicit AA-contrast fallback and must not be replaced by an unverified approximation.

### Typography

The source family is Gilroy. The application bundles the two weights supplied under the Gilroy Free Font EULA as optimized WOFF2 assets: Light covers weights 100-500 and ExtraBold covers weights 600-900. The original OTF files are not distributed. Inter remains the complete fallback family for unsupported glyphs.

The stack is exposed through `--ds-font-family`. Browser screenshot tests use the same bundled Gilroy faces as production and wait for both relevant weights before capture. The free package does not contain a distinct SemiBold file, so the requested CSS weight 600 resolves to the supplied ExtraBold face. The applicable third-party license is preserved in `docs/licenses/gilroy-free-font-eula.pdf`.

| Style             |  Size |           Weight | Line height |
| ----------------- | ----: | ---------------: | ----------: |
| `Headings/H1`     | 24 px |              700 |        150% |
| `Headings/H2`     | 20 px |              700 |        150% |
| `Headings/H3`     | 18 px |              600 |        150% |
| `Headings/H4`     | 16 px |              600 |        150% |
| `Headings/Sub H1` | 14 px |              600 |        150% |
| `Headings/Sub H2` | 12 px |              600 |        150% |
| `Body/Body1`      | 14 px |              500 |        150% |
| `Body/Body2`      | 12 px |              500 |        150% |
| `Misc/Button`     | 14 px |              700 |        150% |
| `Misc/Button2`    | 12 px | 700, 4% tracking |        150% |

### Spacing, shape, and elevation

- Spacing scale: `4, 8, 12, 16, 24, 32, 40, 48, 56, 72` px.
- Micro radius: `4px` for buttons, fields, and navigation details.
- Card radius: `8px`.
- Selector radius: `25px`.
- Pill radius: `999px`.
- `Card-Shadow`: `0 2px 4px rgb(0 0 0 / 7%)`.
- Primary control shadow: `0 0 12px rgb(0 0 0 / 8%)`.
- Toggle thumb shadow: `0 1px 3px rgb(0 0 0 / 20%)`.
- Keyboard focus: a `3px` high-contrast ring with a `3px` offset. Focus is never communicated by color alone.

## Components

### Buttons

- Primary: accessible dark-green surface, white text, `4px` radius, primary control shadow. White measures `5.34:1` against the default surface and `7.21:1` against hover, meeting WCAG AA while preserving the source's green action treatment.
- Secondary: white surface, `#E5E5E5` border, primary text.
- Wizard actions: `32px` visual height, `12px` text, uppercase, `16px` inline padding.
- Selector and completion actions: `40px` visual height, `14px` text, `16px` inline padding.
- Coarse-pointer layouts expand the interactive height to at least `48px` without changing the desktop reference geometry.
- Primary hover uses the shared accessible action-hover token; feature components do not define local button colors.

### Inputs

- White surface, `#747980` accessible boundary, `4px` radius. The source `#E5E5E5` border measures only `1.26:1` against white, so geometry is preserved while the boundary is strengthened for WCAG 1.4.11.
- Reference geometry: `48px` visual height, `12px` inline padding.
- Focus uses the design-system green plus the global focus ring.
- Invalid inputs add the error border and error surface while retaining an adjacent text explanation.
- Number values remain numeric in the typed form. Constraints are applied only when the schema declares them; the supplied contract defines no numeric minimum.

### Radio choices

- Each native radio remains in the accessibility tree.
- Options use compact `32px` pill containers, an `8px` gap, and a deterministic custom-drawn `16px` radio face.
- Selected, invalid, hover, and focus states include shape or text feedback in addition to color.
- Hover treatment is enabled only when the browser reports a hover-capable pointer.

### Toggle

- Native checkbox semantics with `role="switch"`.
- Track: `32 × 18px`; thumb: `14px`; internal padding: `2px`.
- The transparent native control covers the visual track so browser automation, pointer input, and keyboard input activate the same element.

### Question card

- White surface, `8px` radius, `Card-Shadow`, no visible default border.
- `24px` padding and `8px` label-to-control gap.
- Standard text/number card reference: `704 × 125px`.
- Radio card reference: `704 × 109px`.
- Long-text card reference: `704 × 177px`.
- Label: `14px`, semibold, 150% line height.
- Autosave state is aligned with the label and remains secondary to the question.

### Navigation

- Desktop rail: `250 × 84px`, `4px` item gap, `40px` item height, `4px` radius, and a `1px` right rule.
- Both page labels use Gilroy at `14px/600`, `150%` line height, zero tracking, and accessible green text. The inspected `Brand/Green37` value reaches only `2.79–2.96:1` on the two navigation surfaces at this text size, so it remains on the non-text active rule while the labels use `--ds-navigation-text`.
- Current item: low-opacity green surface plus a `2px` `Brand/Green37` right rule.
- Page items are native buttons. Selecting a later page validates the current section before routing; previous pages remain directly available.
- Mobile navigation becomes a two-column horizontal strip above the form.

## Screen recipes

All desktop measurements use the source viewport of `1440 × 1080px`.

### Request type selector

- Card: `1029 × 489px`, `left: 205px`, `top: 152px`.
- Padding: `56px 72px`; radius: `25px`.
- Interaction block: `885 × 240px`, `32px` internal padding.
- Prompt: `Headings/H2`, centered.
- Prompt-to-chip and chip-to-action gaps: `32px`.
- Category row: `8px` gap and `42px` line box; selected chip uses a compact `32px` height.
- Start action: `40px` height.

### Request wizard

- Full composition: `1060px` wide and `top: 158px`.
- Columns: `250px` navigation, `32px` gap, `704px` form.
- Section heading: `Headings/H3`, `27px` line box, followed by `12px` space.
- Question cards: `12px` vertical gap.
- Actions: left aligned with a `12px` gap.

The full composition applies from `1025px` upward without interpolation. At the `1440px` source viewport, centering the `1060px` shell places the rail at `left: 190px`; that coordinate is an outcome of the centered layout and is not hardcoded for narrower desktops.

The task frames contain demonstration questions. Production labels, field counts, and values come exclusively from the validated Software and Hardware schemas, so content height is intentionally data-driven.

### Completion summary

- Card: `720px` wide, `749.96px` reference height, `left: 416px`, `top: 99px`.
- Padding: `56px 72px`; radius: `8px`; main gap: `40px`.
- Success hero: `384 × 268.96px`, vertical, `16px` gap.
- Answer area: `576px` wide, vertical, `8px` gap.
- Action row: `576 × 40px`, centered action.

The answer table renders every schema question. Its card may grow beyond the reference height when validated schemas contain more rows than the four demonstration rows.

## Responsive and accessibility contract

- From `1025px` upward, the wizard uses the full `250px` rail, `32px` gap, `704px` form, and `158px` top offset.
- Between `769px` and `1024px`, the wizard uses a `200px` rail, `24px` gap, flexible form track, and `80px` top offset.
- Below `768px`, navigation moves above the form and grid rows size to content; no viewport-height row stretching is allowed.
- At `390px`, outer padding is `16px`, cards fill the available width, radio choices stack when necessary, and controls expose at least `48px` pointer targets.
- Every coarse-pointer selector action, including the selected chip and recovery actions, exposes at least `48px` height at any viewport width.
- Native form, fieldset, legend, input, radio, and checkbox semantics are retained.
- Validation uses `aria-invalid`, connected `aria-describedby`, an assertive summary, visible adjacent messages, and focus transfer to the first invalid control.
- Save status keeps a polite live region mounted, includes the field label in every announcement, and preserves focus during manual retry. Reduced-motion preferences disable non-essential transitions.

## Governance

`src/styles.scss` is the token source. Feature styles may consume `--ds-*` variables but must not introduce alternate brand, neutral, radius, or shadow values. Any deliberate deviation from this contract requires a documented accessibility, responsive, or schema-driven reason and a matching test.
