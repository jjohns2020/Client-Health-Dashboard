# Collections Optimization · ROI Dashboard

React + TypeScript (Vite) build of the CO ROI Dashboard. The single-file prototype
`CO_ROI_Dashboard_Mockup (1).html` remains in the repo as the source of truth for design and business logic.

All data is **sample data** from the prototype. Values labelled *illustrative* / *sample* in the UI are not validated
production data. No production systems, Microsoft 365, APIs, databases or client data are connected.

## Run

```bash
npm install
npm run dev        # local dev server
npm run build      # type-check + production build to dist/
npm test           # unit tests for ROI logic, visibility rules, data checks, export plan, state rules
npm run parity     # after build: compares the app against the prototype in headless Chrome
```

`npm run parity` drives the prototype and the built app through the same clicks (every client, date preset,
custom ranges, presentation mode, profile toggle, view, workflow detail and in-page toggle) and diffs visible text,
SVG chart geometry and computed styles after each step. Set `CHROME_PATH` if Chrome is not at `/usr/local/bin/google-chrome`.

## Structure

```
src/
  data/
    types.ts            Dataset shape the whole UI reads
    dataSource.ts       DataSource seam; sampleDataSource loads the prototype's sample data
    sample/             clients, monthly trend, scrub trends, workflow slides, insights, opportunities, …
  lib/                  Pure business logic (no React)
    roi.ts              ROI ratio, total value, % change, annualizing, Medicaid attribution, Return Mail guarantor scaling
    dateRange.ts        Presets, range label, truncation of monthly series, rolling averages
    visibility.ts       Nav per client profile, internal-only views, PFC filtering, insight audience
    dataChecks.ts       Pre-export checklist and overall status
    exportPlan.ts       PowerPoint slide list and export gate
    medicaid.ts         Medicaid detail re-stated by delivery source
    format.ts           Number / currency / percent formatting
  state/
    dashboardState.ts   Reducer + normalization (presentation-mode and profile fallbacks)
    DashboardContext.tsx
  components/           Layout (header, sidebar), charts (SVG), shared widgets, scrub trends, export modal
  views/                One component per page; views/internal/ holds the Executive Brief, Opportunity Sizing, Data Checks, Portfolio
  styles/global.css     Prototype CSS, unchanged
```

## Internal vs client-facing

- The Executive Brief, Opportunity Sizing, Data Checks and Portfolio are internal only: hidden from navigation in presentation mode and
  never listed in the export. The brief is a consultant prep page: the client headline, internal notes, open opportunities, and data-check items.
- Presentation mode also hides the client profile panel, locks the client selector, and removes internal insights,
  data-load tables, source notes, data flags and illustrative-split labels that the prototype marks as internal.

## PowerPoint export

Export to PowerPoint downloads a copy of `Utilization Review Template_2025.pptx` with this client's name, period, ROI, and recommendations written in. Slides for workflows the profile does not use are removed, along with the consultant instruction slide and slides that still contain another example's dollar figures. Portfolio, Opportunity Sizing, Data Checks, other clients, the Executive Brief, and internal notes are not added. Illustrative sample figures keep that label. Data Checks status NOT READY (a FIX item) disables the download; REVIEW does not. The file is filled in the browser from the template. No Microsoft 365 connection is used.

## Connecting real data later

Implement `DataSource` (see `src/data/dataSource.ts`) to return a `Dataset` and pass it to `<App dataSource={…} />`.
Views and business logic only read the `Dataset` shape.
