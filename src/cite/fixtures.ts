/**
 * Sample citations, one per kind the card handles.
 *
 * All figures, people and conversations are invented demo data. Company names
 * are real only so the favicon service returns a mark; none is a customer.
 */
import type { BreakdownRow, Citation, Excerpt, Source } from "./citation"

const SALESFORCE: Source = { name: "Salesforce", domain: "salesforce.com" }
const GONG: Source = { name: "Gong", domain: "gong.io" }
const AMPLITUDE: Source = {
  name: "Amplitude",
  domain: "amplitude.com",
  href: "#amplitude",
}
const GAMA: Source = { name: "Gama" }

const EMEA_ACCOUNTS: BreakdownRow[] = [
  { name: "Ramp", domain: "ramp.com", value: 312_000 },
  { name: "Linear", domain: "linear.app", value: 268_400 },
  { name: "Vercel", domain: "vercel.com", value: 197_250 },
  { name: "Notion", domain: "notion.so", value: 154_800 },
]

/** The everyday case: a metric the engine computed, with its breakdown. */
export const pipelineCreated: Citation = {
  kind: "metric",
  id: "pipeline-created",
  title: "Pipeline created",
  verified: true,
  reportHref: "#report",
  studioHref: "#studio",
  figure: {
    unit: "currency",
    live: { value: 1_284_500, on: "2026-09-17" },
    cited: { value: 1_284_500, on: "2026-09-12" },
  },
  definition:
    "Sum of opportunity value created in the window, counted on the day each opportunity entered the pipeline.",
  chips: [
    { kind: "timeframe", label: "Last 90 days" },
    { kind: "dimension", label: "Stage" },
    { kind: "filter", label: "Region is EMEA" },
  ],
  breakdown: EMEA_ACCOUNTS,
  breakdownTotal: 37,
  sources: [SALESFORCE],
}

/** Two citations side by side in the prose, which share one mark and page between. */
export const groupedPair: Citation = {
  ...pipelineCreated,
  id: "grouped-pair",
  group: {
    kind: "metric",
    id: "grouped-pair-calls",
    title: "Pipeline confirmed on calls",
    verified: true,
    reportHref: "#report",
    studioHref: "#studio",
    figure: {
      unit: "currency",
      live: { value: 1_251_000, on: "2026-09-17" },
      cited: { value: 1_251_000, on: "2026-09-12" },
    },
    definition:
      "Opportunity value that a recorded sales call also mentioned in the window. A second source backing the first.",
    chips: [
      { kind: "timeframe", label: "Last 90 days" },
      { kind: "filter", label: "Region is EMEA" },
    ],
    breakdown: EMEA_ACCOUNTS.slice(0, 3),
    breakdownTotal: 29,
    sources: [GONG],
  },
}

/** No query behind it: Gama worked the value out from two cited figures. */
export const agentComputed: Citation = {
  kind: "derived",
  id: "agent-computed",
  title: "Share of pipeline from partners",
  verified: true,
  reportHref: "#report",
  figure: { unit: "percent", live: { value: 18.6, on: "2026-09-17" } },
  working:
    "Partner-sourced pipeline ($238K) divided by all pipeline created ($1.28M). Both inputs are cited earlier in the report.",
  chips: [
    { kind: "timeframe", label: "Last 90 days" },
    { kind: "filter", label: "Source is Partner" },
  ],
  sources: [GAMA],
}

/** Read straight from a connector, never through the metric engine. */
export const connectorNative: Citation = {
  kind: "connector",
  id: "connector-native",
  title: "Weekly active accounts",
  verified: true,
  reportHref: "#report",
  figure: {
    unit: "count",
    live: { value: 8_613, on: "2026-09-17" },
    cited: { value: 8_420, on: "2026-09-12" },
  },
  note: "Taken as-is from Amplitude's weekly active accounts chart. The metric engine never touches this number.",
  chips: [{ kind: "timeframe", label: "Week to 2026-09-12" }],
  sources: [AMPLITUDE],
}

/** How many accounts the graph holds with an open pain, previewed below. */
export const countedAccounts: Citation = {
  kind: "count",
  id: "counted-accounts",
  title: "Accounts with an open pain",
  verified: true,
  reportHref: "#report",
  graphHref: "#graph",
  figure: {
    unit: "count",
    live: { value: 12, on: "2026-09-17" },
    cited: { value: 9, on: "2026-09-12" },
  },
  definition:
    "Accounts where a pain surfaced in a conversation during the window and has not been resolved since.",
  counts: "accounts",
  rows: [
    { name: "Ramp", domain: "ramp.com" },
    { name: "Linear", domain: "linear.app" },
    { name: "Vercel", domain: "vercel.com" },
    { name: "Notion", domain: "notion.so" },
  ],
  chips: [
    { kind: "timeframe", label: "Last 90 days" },
    { kind: "filter", label: "Pain is open" },
  ],
  sources: [GONG],
}

/** An account named in prose. No figure and no evidence: it exists, or it does not. */
export const namedAccount: Citation = {
  kind: "entity",
  id: "named-account",
  title: "Northwind Logistics",
  verified: true,
  reportHref: "#report",
  graphHref: "#graph",
  entity: {
    kind: "account",
    domain: "notion.so",
    about: "Enterprise freight operator. Customer since March, up for renewal in Q1.",
  },
  chips: [
    { kind: "dimension", label: "Enterprise" },
    { kind: "owner", label: "Dana Whitfield" },
    { kind: "filter", label: "Renewal in 90 days" },
  ],
  sources: [SALESFORCE],
}

/** A person named in prose. */
export const namedChampion: Citation = {
  kind: "entity",
  id: "named-champion",
  title: "Dana Whitfield",
  verified: true,
  reportHref: "#report",
  graphHref: "#graph",
  entity: {
    kind: "champion",
    about:
      "CFO at Northwind. Brought up the reconciliation problem on three calls and asked for one agreed number.",
  },
  chips: [
    { kind: "dimension", label: "Account is Northwind" },
    { kind: "filter", label: "Spoke in 4 activities" },
  ],
  sources: [GONG],
}

const REVIEW_BEFORE =
  "The pack went out on Thursday instead of Tuesday again, second time this quarter. Priya had the CRM export by Monday lunch, and then it sat there while someone reconciled billing by hand."
const REVIEW_AFTER =
  "If both systems agreed on one number we would get two days back and a lot less arguing. I am not after a new tool. I want to stop paying three people to agree on a figure that should not be in dispute. It has been this way since the migration."

const REVIEW_LINE: Excerpt = {
  activity: "Q3 business review",
  medium: "meeting",
  speaker: "Dana Whitfield, CFO",
  on: "2026-09-12",
  before: REVIEW_BEFORE,
  line: "We rebuild that pipeline number by hand every single month, and I still do not fully trust it.",
  after: REVIEW_AFTER,
}

/** One line from a meeting, shown inside the turns around it. */
export const quotedActivity: Citation = {
  kind: "quote",
  id: "quoted-activity",
  title: "Q3 business review",
  verified: true,
  reportHref: "#report",
  graphHref: "#graph",
  excerpt: REVIEW_LINE,
  chips: [{ kind: "dimension", label: "Account is Northwind" }],
  sources: [GONG],
}

/** A pain inferred across several conversations, one line of evidence each. */
export const signalPain: Citation = {
  kind: "signal",
  id: "signal-pain",
  title: "Manual reconciliation before every board pack",
  verified: true,
  reportHref: "#report",
  graphHref: "#graph",
  signal: "pain",
  claim:
    "Finance rebuilds the pipeline number by hand every month because the CRM and billing disagree.",
  sightings: [
    {
      title: "Q3 business review",
      medium: "meeting",
      on: "2026-09-12",
      excerpt: REVIEW_LINE,
    },
    {
      title: "Weekly pipeline call",
      medium: "call",
      on: "2026-09-04",
      excerpt: {
        activity: "Weekly pipeline call",
        medium: "call",
        speaker: "Marcus Oyelaran, RevOps",
        on: "2026-09-04",
        before: "Two of the renewals came back different on the billing export again.",
        line: "It is the same two accounts every month, so we just fix them by hand now.",
        after: "Nobody has time to find out which system is wrong, so we take the CRM figure and move on.",
      },
    },
    {
      title: "Re: board pack numbers",
      medium: "email",
      on: "2026-08-28",
      excerpt: {
        activity: "Re: board pack numbers",
        medium: "email",
        speaker: "Priya Raman, RevOps",
        on: "2026-08-28",
        line: "Going with the CRM figure and noting the variance, same as last quarter.",
      },
    },
  ],
  unshown: 1,
  chips: [
    { kind: "timeframe", label: "Last 90 days" },
    { kind: "dimension", label: "Account is Northwind" },
  ],
  sources: [GONG],
}

/**
 * The report cited 37 accounts on 2026-09-12; the live count is now 57.
 *
 * The card leads with the live reading so the figure and its breakdown always
 * reconcile. What the report pinned is carried in `figure.cited` for anyone
 * who wants to state it beside the card, but the card itself does not draw it.
 */
export const citedThenDrifted: Citation = {
  kind: "metric",
  id: "cited-then-drifted",
  title: "Accounts in pipeline",
  verified: true,
  reportHref: "#report",
  studioHref: "#studio",
  figure: {
    unit: "count",
    live: { value: 57, on: "2026-09-17" },
    cited: { value: 37, on: "2026-09-12" },
  },
  definition: "Every account with at least one open opportunity when the count ran.",
  chips: [
    { kind: "timeframe", label: "Open now" },
    { kind: "dimension", label: "Stage" },
  ],
  breakdown: EMEA_ACCOUNTS.map((a, i) => ({ ...a, value: [4, 3, 3, 2][i]! })),
  breakdownTotal: 57,
  sources: [SALESFORCE],
}
