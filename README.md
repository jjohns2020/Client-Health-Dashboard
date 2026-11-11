# Collections Optimization · ROI Dashboard

React + TypeScript (Vite) build of the CO ROI Dashboard, opened from the Collections Optimization
Command Center. `CO_Command_Center.html` is the source of truth for the platform (sign-in, command center,
client health, and client success). `CO_ROI_Dashboard_Mockup (1).html` remains the source of truth for the ROI workspace.

All data is **sample data** from the prototypes. Values labelled *illustrative* / *sample* in the UI are not validated
production data. No production systems, Microsoft 365, databases or client data are connected. Each client’s
health tab includes a sample Jira snapshot until a real pull replaces it. Client health has a Jira tracking view grouped by reporter, client label, and component. Tiffany Rudy’s leadership login also shows charts, a CSV download, and tickets by consultant and type of work. That same login can reassign clients and mark an account complex; the consultant tracker turns those marks into availability. Assignments stay in the browser session. The workspace does not read email.

The app opens on the command center sign-in. Choose **Sign in with Microsoft**, then a sample account. Nothing is sent
to a directory, and the workspace does not read email, Outlook, or calendars. Reviews on the home page are ROI reviews
from the stats files and client reviews entered in the workspace. The command center home leads into client health, client success, and ROI. **ROI** is this repository's
dashboard, not the summary tables in the command center prototype. MaineHealth and WashU keep the workbook
figures from the ROI prototype. Every other active client in the command center opens a mock workbook built from that
client's 2025 ROI Stats row (benefit, ratio, and workflow mix). Monthly trends on those workbooks are illustrative.
Clients with no quantified ROI yet still open, with the benefit shown as zero. From the ROI module itself, the client
selector lists the full roster.

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
  platform/             Command center host; ROI opens the dashboard in this repository
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
  views/                One component per page; views/internal/ holds Opportunity Sizing, Data Checks, Portfolio
  styles/global.css     Prototype CSS, unchanged
```

## Internal vs client-facing

- Opportunity Sizing, Data Checks and Portfolio are internal only: hidden from navigation in presentation mode and
  never listed in the export.
- Presentation mode also hides the client profile panel, locks the client selector, and removes internal insights,
  data-load tables, source notes, data flags and illustrative-split labels that the prototype marks as internal.

## PowerPoint export

Export to PowerPoint downloads a copy of `Utilization Review Template_2025.pptx` with this client's name, period, ROI, and recommendations written in. Slides for workflows the profile does not use are removed, along with the consultant instruction slide and slides that still contain another example's dollar figures. Portfolio, Opportunity Sizing, Data Checks, other clients, and internal notes are not added. Illustrative sample figures keep that label. Data Checks status NOT READY (a FIX item) disables the download; REVIEW does not. The file is filled in the browser from the template. No Microsoft 365 connection is used.

The Executive Highlights page has its own download: a Word document (`.docx`) with the headline figures, value sources, analyst highlights, and executive message. It is not a slide in the PowerPoint. The same file can be downloaded from the export dialog. Internal notes are left out, and NOT READY disables it the same way.

## Jira, per client

Each client in `jira/clients.json` can have a JQL query. The pull calls Jira’s API and writes
`public/jira-clients.json`. The command center loads that file and shows the matching issues on that
client’s health tab and replaces the sample file `jira/mock-clients.json`. Client health → Jira tracking
groups those tickets by reporter (consultant), client label, and component (type of work). Tiffany Rudy’s
leadership login adds open-ticket charts, a month-over-month chart of tickets opened and closed, a date range that filters that chart and the ticket download, a chart export that keeps the titles and bars, a CSV download, and a consultant-by-type grid. Every tracking table shows the open date, the closed date when the ticket is done, and aging in days since the ticket was opened. An empty `jql` leaves that client on the sample issues.
The API token stays in the environment and is never written into the page.

```bash
export JIRA_BASE_URL=https://your-site.atlassian.net
export JIRA_EMAIL=you@experian.com
export JIRA_API_TOKEN=...
# example query in jira/clients.json:
# "jql": "text ~ \"MaineHealth\" ORDER BY updated DESC"
npm run jira:pull
```

GitHub Pages runs the same pull during deploy when the repository secrets `JIRA_BASE_URL`, `JIRA_EMAIL`,
and `JIRA_API_TOKEN` are set. Without those secrets the site keeps the sample issues.

## Leadership admin

Tiffany Rudy’s login is the leadership role. Backend admin reassigns a client to another consultant and marks the account complex or standard. The consultant tracker scores each book at 1 point per standard client and 2 points per complex client, against an 8-point full book, and labels the consultant available, limited, or full. Those edits stay in the browser session. Client reviews stay read-only for leadership.

## Connecting real data later

Implement `DataSource` (see `src/data/dataSource.ts`) to return a `Dataset` and pass it to `<App dataSource={…} />`.
Views and business logic only read the `Dataset` shape.
