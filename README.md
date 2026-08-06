# Dynamic Request Form

A schema-driven procurement request experience built as an Angular single-page application. Users choose a request type, complete one section at a time, receive accessible validation feedback, and review a read-only summary after every answer has been saved.

## Demo

The production URL will be added after the Cloudflare Pages project is connected.

## Stack

- Angular 21 with standalone components
- TypeScript in strict mode
- Typed Reactive Forms
- Signals for synchronous UI state
- RxJS for debounced autosave, cancellation, and retry
- SCSS and CSS custom properties
- Vitest for unit and integration tests
- Playwright and axe-core for end-to-end and WCAG checks

## Requirements

- Node.js 22 LTS
- npm 11 or newer

The expected Node version is recorded in `.nvmrc`.

## Local setup

```bash
nvm use
npm ci
npm start
```

Open `http://localhost:4200`.

## Architecture

```text
src/app
├── core
│   ├── data          Request schema fixtures
│   ├── forms         Typed form construction and serialization
│   ├── models        Public domain and form types
│   ├── services      Schema gateway and mock request API
│   └── validation    Runtime schema validation
├── features/request
│   ├── components    Wizard, section, field shell, and dynamic renderer
│   ├── fields        Text, number, radio, and toggle renderers
│   ├── pages         Chooser, wizard, and summary route pages
│   └── services      Request session and per-question autosave
└── ui                Domain-agnostic buttons, errors, and save states
```

Pages orchestrate routes. Feature components own request behavior. Field components render exactly one schema field type. Shared UI primitives have no request-domain knowledge. Services own schema loading, the in-memory session, and API-shaped asynchronous work.

No component branches on Software or Hardware. Adding a valid schema, section, or supported question type is data-driven.

## Autosave flow

Each control has an independent RxJS pipeline:

```text
valueChanges
→ distinctUntilChanged
→ Saving…
→ debounce 750 ms
→ cancel obsolete request
→ simulated PUT
→ retry after 500 ms and 1000 ms
→ Saved or final error
```

The simulated API adds 600–1000 ms of latency and a 15% failure rate. Its timing and random provider are injectable so tests remain deterministic. Section navigation keeps the form state in memory and does not wait for autosave. Final submission waits for pending saves and remains blocked if a final error needs a manual retry.

## Validation and accessibility

- Native forms, fieldsets, legends, inputs, radios, and checkbox switch
- Errors after blur or a navigation attempt, never on initial render
- Operable navigation buttons that mark fields, announce a summary, and focus the first error
- Connected `aria-describedby`, `aria-invalid`, `aria-live`, and `aria-current` states
- Visible keyboard focus, 40 px visual controls with 48 px mobile targets, reduced-motion support, and responsive fallback layouts
- Automated axe checks against WCAG 2.2 AA in desktop and mobile projects
- Playwright visual baselines for the chooser, both wizard pages, Hardware toggle, and summary

## Quality commands

```bash
npm run lint
npm run test:coverage
npm run build
npm run e2e
```

Coverage thresholds are enforced at 80% for statements, functions, and lines, and 75% for branches. Playwright runs at 1440×900 and 390×844; traces, screenshots, and videos are retained only on failure.

## Routing and persistence

- `/` selects a schema.
- `/request/:schemaId/:sectionId` displays the active section.
- `/summary/:requestId` displays the submitted snapshot.

The application intentionally has no backend or recovery endpoint. Reloading a request or summary URL clears the in-memory context and returns to the selector. Cloudflare Pages uses `public/_redirects` to serve `index.html` for direct SPA routes.

## Deployment

Cloudflare Pages builds the private GitHub repository with:

- Production branch: `main`
- Build command: `npm run build`
- Output directory: `dist/opstream-fe-test/browser`
- Node.js version: `22`

The deployed site is public while the source repository remains private.
