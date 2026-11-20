/**
 * The data a citation card renders, and the small rules the card reads it by.
 *
 * One `Citation` type covers every kind. The `kind` field says which body the
 * citation carries; everything else (title, scope chips, sources, the figure)
 * is shared, so the card can lay every kind out on the same seven slots.
 *
 * Dates are stored and shown as ISO 8601 (`YYYY-MM-DD`).
 */

export type Unit = "currency" | "count" | "percent"

/** Who is looking: someone signed in to the product, or a reader of a shared link. */
export type Audience = "in-app" | "public"

/** How much of the anatomy the card fills. */
export type Detail = "full" | "simplified"

export type ChipKind = "timeframe" | "dimension" | "filter" | "owner"

export type Chip = { kind: ChipKind; label: string }

/** A system a number came from. No domain means Gama itself. */
export type Source = {
  name: string
  domain?: string
  /** Where that system shows the value, for a value read straight from it. */
  href?: string
}

/** A value, and the day (ISO 8601) it was true. */
export type Reading = { value: number; on: string }

export type Figure = {
  unit: Unit
  /** What the card shows. The breakdown is counted against this reading. */
  live: Reading
  /** What the report pinned when it was written, if anything. Carried, not drawn. */
  cited?: Reading
}

export type Medium = "call" | "email" | "meeting" | "document" | "note"

/** One line from a conversation, with the turns either side of it. */
export type Excerpt = {
  activity: string
  medium: Medium
  speaker: string
  /** ISO 8601 day. */
  on: string
  line: string
  before?: string
  after?: string
}

export type SignalKind = "pain" | "impact" | "goal" | "risk" | "requirement"

export type EntityKind =
  | "account"
  | "person"
  | "champion"
  | "economic-buyer"
  | "competitor"

export type BreakdownRow = { name: string; domain: string; value: number }

export type CountedRow = {
  name: string
  domain?: string
  /** A date for an activity, a kind for a signal; nothing for an account. */
  note?: string
}

export type SignalSighting = {
  title: string
  medium: Medium
  /** ISO 8601 day. */
  on: string
  excerpt: Excerpt
}

type Shared = {
  id: string
  title: string
  /** Whether the coverage check confirmed this citation. Absent shield = not confirmed. */
  verified: boolean
  chips: Chip[]
  sources: Source[]
  /** Where the report lives in the app. What a public reader is sent to. */
  reportHref: string
  figure?: Figure
  /** Set on entity citations only; readable on any citation so pages can ask for a logo. */
  entity?: Entity
  /** A second citation sitting beside this one in the prose. */
  group?: Citation
}

export type MetricBody = {
  kind: "metric"
  studioHref: string
  definition?: string
  breakdown: BreakdownRow[]
  breakdownTotal: number
}

export type DerivedBody = {
  kind: "derived"
  /** How Gama arrived at the value. Stands where a definition would. */
  working: string
}

export type ConnectorBody = {
  kind: "connector"
  /** What the connector reported, in a line. */
  note: string
}

export type CountBody = {
  kind: "count"
  graphHref: string
  definition?: string
  counts: "accounts" | "activities" | "entities"
  rows: CountedRow[]
}

/** A thing in the graph named in prose: a company or a person. */
export type Entity = {
  kind: EntityKind
  /** A company's logo domain. People have none. */
  domain?: string
  about?: string
}

export type EntityBody = {
  kind: "entity"
  graphHref: string
  entity: Entity
}

export type QuoteBody = {
  kind: "quote"
  graphHref: string
  excerpt: Excerpt
}

export type SignalBody = {
  kind: "signal"
  graphHref: string
  signal: SignalKind
  claim: string
  /** Most recent first. */
  sightings: SignalSighting[]
  /** Sightings this citation does not carry. */
  unshown?: number
}

export type CitationBody =
  | MetricBody
  | DerivedBody
  | ConnectorBody
  | CountBody
  | EntityBody
  | QuoteBody
  | SignalBody

export type Citation = Shared & CitationBody

export type CitationKind = CitationBody["kind"]

/* ─────────────────────────────── rules ─────────────────────────────── */

export const GRAPH_KINDS: readonly CitationKind[] = [
  "count",
  "entity",
  "quote",
  "signal",
]

export function fromGraph(c: Citation): boolean {
  return GRAPH_KINDS.includes(c.kind)
}

/** Quotes and signals put a named person's words on the card. */
export function carriesSpeech(c: Citation): boolean {
  return c.kind === "quote" || c.kind === "signal"
}

/** A shared link never shows somebody's words, so those kinds get no card there. */
export function hasCard(c: Citation, audience: Audience): boolean {
  return !(audience === "public" && carriesSpeech(c))
}

export type MarkKind = "engine" | "graph" | "gama" | "logos"

/** What the source row names, and the mark drawn beside it. */
export type Attribution = {
  key: string
  label: string
  mark: MarkKind
  sources: Source[]
}

export function attributionOf(c: Citation): Attribution {
  if (c.kind === "metric") {
    return { key: "engine", label: "Metric Engine", mark: "engine", sources: [] }
  }
  if (fromGraph(c)) {
    return { key: "graph", label: "Context graph", mark: "graph", sources: [] }
  }
  if (c.kind === "derived" || c.sources.every((s) => !s.domain)) {
    return { key: "gama", label: "Gama", mark: "gama", sources: [] }
  }
  const names = c.sources.map((s) => s.name)
  const label =
    names.length === 1
      ? names[0]!
      : names.length === 2
        ? `${names[0]} and ${names[1]}`
        : `${names.length} sources`
  return { key: names.join("+"), label, mark: "logos", sources: c.sources }
}

/* ───────────────────────────── formatting ──────────────────────────── */

/** The figure exactly, as the header shows it: `$1,284,500`, `57`, `18.60%`. */
export function formatExact(value: number, unit: Unit): string {
  const sign = value < 0 ? "−" : ""
  const n = Math.abs(value)
  switch (unit) {
    case "currency":
      return `${sign}$${n.toLocaleString("en-US", {
        minimumFractionDigits: Number.isInteger(n) ? 0 : 2,
        maximumFractionDigits: 2,
      })}`
    case "percent":
      return `${sign}${n.toFixed(2)}%`
    case "count":
      return `${sign}${n.toLocaleString("en-US")}`
  }
}

/** A row's share, compact: `$312K`, `$37.8K`, `$1.2M`, `27.4%`, `312`. */
export function formatCompact(value: number, unit: Unit): string {
  const sign = value < 0 ? "−" : ""
  const n = Math.abs(value)
  switch (unit) {
    case "currency": {
      const steps: [number, string][] = [
        [1e9, "B"],
        [1e6, "M"],
        [1e3, "K"],
      ]
      const step = steps.find(([size]) => n >= size)
      if (!step) return `${sign}$${Math.round(n)}`
      const scaled = n / step[0]
      const body =
        scaled < 100 ? String(Math.round(scaled * 10) / 10) : String(Math.round(scaled))
      return `${sign}$${body}${step[1]}`
    }
    case "percent":
      return `${sign}${(Math.round(n * 10) / 10).toString()}%`
    case "count":
      return `${sign}${n.toLocaleString("en-US")}`
  }
}
