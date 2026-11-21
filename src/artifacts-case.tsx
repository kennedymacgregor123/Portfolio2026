import { useEffect, useId, useRef, useState } from "react"

import type { CaseStudy } from "./case-study"
import { Store, TrendingDown, TrendingUp } from "lucide-react"

import { INK, Kpi, LINE, MUTED, ReportUIHero } from "./reportui-hero"
import { Callout, ForecastChart, Scaled } from "./report-kit"
import { ArtifactsHero } from "./artifacts-hero"
import { ScribbleNote } from "./scribble-note"

/*
 * The Artifacts case study: recurring, agent-generated reports built from a
 * kit of report components and a library of templates. The panels are drawn
 * in the same style as the hero's report. Figures in them are invented.
 */

const FONT = "font-['Inter_Variable',Inter,sans-serif]"

/** A report page, as the panels show one: a white sheet with a hairline
    edge, a faint top highlight and a soft lift off the panel. */
function Sheet({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={`rounded-[14px] border bg-white shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_1px_2px_rgba(15,15,15,0.04),0_14px_34px_-18px_rgba(15,15,15,0.16)] ${FONT} ${className}`}
      style={{ borderColor: "#e9e9e6", color: INK }}
    >
      {children}
    </div>
  )
}

function MiniKpi({ label, value, delta, down }: { label: string; value: string; delta: string; down?: boolean }) {
  return (
    <div className="min-w-0 flex-1 rounded-[10px] border bg-[#fafaf9] px-2.5 pt-2 pb-2.5" style={{ borderColor: "#efefed" }}>
      <div className="text-[9.5px] leading-tight whitespace-nowrap" style={{ color: MUTED }}>{label}</div>
      <div className="mt-1 text-[16px] leading-none font-semibold tracking-[-0.3px] tabular-nums">{value}</div>
      <span
        className="mt-2 inline-flex items-center gap-0.5 rounded-full px-1.5 py-px text-[9px] font-medium tabular-nums"
        style={down ? { background: "#fcecea", color: "#b8433b" } : { background: "#e7f5ed", color: "#2b7a51" }}
      >
        {down ? <TrendingDown strokeWidth={2.5} className="size-[8px]" aria-hidden /> : <TrendingUp strokeWidth={2.5} className="size-[8px]" aria-hidden />}
        {delta}
      </span>
    </div>
  )
}

/** A smooth line through evenly spaced points (Catmull-Rom as Béziers). */
function smoothLine(pts: [number, number][]) {
  let d = `M${pts[0]![0]} ${pts[0]![1]}`
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] ?? pts[i]!
    const p1 = pts[i]!
    const p2 = pts[i + 1]!
    const p3 = pts[i + 2] ?? p2
    d += ` C ${(p1[0] + (p2[0] - p0[0]) / 6).toFixed(1)} ${(p1[1] + (p2[1] - p0[1]) / 6).toFixed(1)}, ${(p2[0] - (p3[0] - p1[0]) / 6).toFixed(1)} ${(p2[1] - (p3[1] - p1[1]) / 6).toFixed(1)}, ${p2[0].toFixed(1)} ${p2[1].toFixed(1)}`
  }
  return d
}

/** A small area chart, from a list of values between 0 and 1: a smooth line
    over a fill that fades to nothing, on faint dotted guides. */
function MiniTrend({ values, className = "h-[56px]" }: { values: number[]; className?: string }) {
  const id = useId()
  const step = 200 / (values.length - 1)
  const pts = values.map((v, i) => [i * step, 52 - v * 44] as [number, number])
  const line = smoothLine(pts)
  return (
    <svg viewBox="0 0 200 56" className={`block w-full ${className}`} preserveAspectRatio="none" aria-hidden>
      <defs>
        <linearGradient id={id} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="#3fae7a" stopOpacity="0.16" />
          <stop offset="1" stopColor="#3fae7a" stopOpacity="0" />
        </linearGradient>
      </defs>
      {[6, 29, 52].map((y) => (
        <line key={y} x1="0" x2="200" y1={y} y2={y} stroke="#efefed" strokeDasharray="2 3" vectorEffect="non-scaling-stroke" />
      ))}
      <path d={`${line} L200 56 L0 56 Z`} fill={`url(#${id})`} />
      <path d={line} fill="none" stroke="#3fae7a" strokeWidth="1.6" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
    </svg>
  )
}

/** A report's title row: its name, and the day it ran in a quiet pill. */
function RunHeader({ title, date }: { title: string; date: string }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-[13.5px] font-semibold tracking-[-0.15px]">{title}</span>
      <RunDate date={date} />
    </div>
  )
}

function RunDate({ date }: { date: string }) {
  return (
    <span
      className="shrink-0 rounded-full border bg-[#fafaf9] px-2 py-[1px] text-[9.5px] font-medium"
      style={{ borderColor: "#ececea", color: MUTED }}
    >
      {date}
    </span>
  )
}

/** A chart card inside a report: a title, an optional figure, the chart. */
function ChartCard({ title, figure, children }: { title: string; figure?: string; children: React.ReactNode }) {
  return (
    <div className="mt-3 rounded-[10px] border bg-[#fafaf9] px-3 pt-2.5 pb-2" style={{ borderColor: "#efefed" }}>
      <div className="flex items-baseline justify-between">
        <span className="text-[10px] font-medium">{title}</span>
        {figure && (
          <span className="text-[9.5px] tabular-nums" style={{ color: MUTED }}>
            {figure}
          </span>
        )}
      </div>
      {children}
    </div>
  )
}

/* ---------- Problem: the same prompt, two different reports ---------- */

/** Whether the window is at least `px` wide, kept up to date as it resizes. */
function useMinWidth(px: number) {
  const query = `(min-width: ${px}px)`
  const [match, setMatch] = useState(() => typeof window !== "undefined" && window.matchMedia(query).matches)
  useEffect(() => {
    const mq = window.matchMedia(query)
    const on = () => setMatch(mq.matches)
    on()
    mq.addEventListener("change", on)
    return () => mq.removeEventListener("change", on)
  }, [query])
  return match
}

function DriftingReports() {
  // Side by side, the note sits above both reports and points down at the
  // second. Stacked (a phone), it moves down to sit just above the second
  // report, so its arrow doesn't cross the first.
  const wide = useMinWidth(640)
  const note = (
    <ScribbleNote key={wide ? "wide" : "narrow"} target="[data-drift-run]" className={wide ? "top-0 right-6" : "top-0 right-2"}>
      Same request??
    </ScribbleNote>
  )
  return (
    <div className={`relative w-full max-w-[38rem] ${wide ? "pt-14" : ""}`}>
      {wide && note}
      <div className="flex flex-col gap-4 sm:flex-row">
        <div className="flex flex-1">
          <Sheet className="flex-1 p-4">
            <RunHeader title="Weekly pipeline review" date="2026-10-05" />
            <div className="mt-3 flex gap-2">
              <MiniKpi label="New pipeline" value="$412K" delta="+12%" />
              <MiniKpi label="Win rate" value="31%" delta="+2pp" />
              <MiniKpi label="Cycle" value="38d" delta="+4d" down />
            </div>
            <ChartCard title="Pipeline created, by week" figure="Last 7 weeks">
              <MiniTrend values={[0.2, 0.35, 0.3, 0.5, 0.45, 0.62, 0.7]} className="mt-1.5 h-[46px]" />
            </ChartCard>
          </Sheet>
        </div>
        {/* The next run of the same request: the chart gone, the KPIs
            folded into prose, the sections in a new order. */}
        <div className={`relative flex flex-1 flex-col ${wide ? "" : "pt-12"}`}>
          {!wide && note}
          <div className="flex flex-1">
            <Sheet className="flex-1 p-4">
              {/* The note's arrow lands on the title, which is all that's
                  left of the first report's name. */}
              <div className="flex items-center justify-between gap-2">
                <span data-drift-run className="text-[13.5px] font-semibold tracking-[-0.15px]">Pipeline update</span>
                <RunDate date="2026-10-12" />
              </div>
              <p className="mt-3 text-[11.5px] leading-[1.55]" style={{ color: "#4b5160" }}>
                This week the team added roughly $390K in new pipeline. Win rate is around 30%, and
                deals are taking a little longer to close than last week.
              </p>
              <div className="mt-3.5 text-[10px] font-medium">Top deals</div>
              <ul className="mt-1.5 flex flex-col text-[11px]" style={{ color: "#4b5160" }}>
                {[
                  ["Northwind renewal", "$84K"],
                  ["Acme expansion", "$61K"],
                  ["Globex, new logo", "$47K"],
                ].map(([deal, amount]) => (
                  <li key={deal} className="flex justify-between border-t py-1.5" style={{ borderColor: "#f0f0ee" }}>
                    <span>{deal}</span>
                    <span className="font-medium tabular-nums" style={{ color: INK }}>{amount}</span>
                  </li>
                ))}
              </ul>
            </Sheet>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ---------- The kit ---------- */

/*
 * The kit as one quiet set: each component drawn directly at a size that
 * reads, in the site's ink and greys with a single green accent (the same
 * green as the hero report's chart), all telling the same report's story.
 */

const KIT_GREEN = "#3fae7a"
const KIT_GREEN_SOFT = "#e9f6ef"
const KIT_SUBTLE = "#9aa0a9"
const KIT_RULE = "#eeeeec"

/** One component of the kit: a white tile holding its specimen, its name below. */
function KitTile({ name, children }: { name: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2.5">
      <div
        className={`flex h-[128px] flex-col justify-center rounded-[12px] border bg-white px-4 py-3.5 ${FONT}`}
        style={{ borderColor: LINE, color: INK }}
      >
        {children}
      </div>
      <span className="project-blurb text-center !text-[12px]">{name}</span>
    </div>
  )
}

/** A small eyebrow inside a specimen, naming what it shows. */
function KitLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-[10.5px] leading-none font-medium" style={{ color: KIT_SUBTLE }}>
      {children}
    </div>
  )
}

function KitHeader() {
  return (
    <>
      <KitLabel>Vasco</KitLabel>
      <div className="mt-1.5 text-[19px] leading-tight font-semibold tracking-[-0.3px]">ICP Analysis</div>
      <div className="mt-3 flex gap-4 text-[10.5px]">
        {[
          ["Period", "Q4 FY26"],
          ["Score", "6.4/10"],
        ].map(([k, v]) => (
          <div key={k}>
            <div style={{ color: KIT_SUBTLE }}>{k}</div>
            <div className="mt-0.5 font-semibold">{v}</div>
          </div>
        ))}
      </div>
    </>
  )
}

function KitKpi() {
  return (
    <>
      <KitLabel>Net New ARR</KitLabel>
      <div className="mt-2 text-[24px] leading-none font-semibold tracking-[-0.4px] tabular-nums">$512K</div>
      <div className="mt-1.5 text-[10.5px]" style={{ color: KIT_SUBTLE }}>
        Across 4 quarters
      </div>
      <span
        className="mt-2.5 inline-flex w-fit items-center gap-1 rounded-full px-1.5 py-0.5 text-[10px] font-medium tabular-nums"
        style={{ background: KIT_GREEN_SOFT, color: "#2f855a" }}
      >
        <TrendingUp strokeWidth={2.5} className="size-[10px]" aria-hidden />
        +80%
      </span>
    </>
  )
}

function KitTrend() {
  const line = "M0 52 C 14 48, 22 40, 34 42 S 52 50, 64 40 S 84 22, 98 26 S 118 34, 132 22 S 152 10, 168 8"
  return (
    <>
      <KitLabel>Win rate, rolling 90d</KitLabel>
      <svg viewBox="0 0 168 60" className="mt-3 block h-[58px] w-full" preserveAspectRatio="none" aria-hidden>
        <defs>
          <linearGradient id="kit-trend" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0" stopColor={KIT_GREEN} stopOpacity="0.16" />
            <stop offset="1" stopColor={KIT_GREEN} stopOpacity="0" />
          </linearGradient>
        </defs>
        {[10, 34, 58].map((y) => (
          <line key={y} x1="0" x2="168" y1={y} y2={y} stroke={KIT_RULE} strokeDasharray="3 3" vectorEffect="non-scaling-stroke" />
        ))}
        <path d={`${line} L168 60 L0 60 Z`} fill="url(#kit-trend)" />
        <path d={line} fill="none" stroke={KIT_GREEN} strokeWidth="1.75" vectorEffect="non-scaling-stroke" />
      </svg>
    </>
  )
}

function KitBars() {
  const bars = [
    { k: "Ent", v: 0.92 },
    { k: "Mid", v: 0.64 },
    { k: "SMB", v: 0.38 },
    { k: "Partner", v: 0.5 },
  ]
  return (
    <>
      <KitLabel>Revenue by segment</KitLabel>
      <div className="mt-3 flex h-[58px] items-end gap-2">
        {bars.map((b, i) => (
          <div key={b.k} className="flex flex-1 flex-col items-center gap-1">
            <span
              className="w-full rounded-t-[3px]"
              style={{ height: `${b.v * 44}px`, background: i === 0 ? KIT_GREEN : "#d9dcdf" }}
            />
            <span className="text-[9px] leading-none" style={{ color: KIT_SUBTLE }}>
              {b.k}
            </span>
          </div>
        ))}
      </div>
    </>
  )
}

function KitTable() {
  const rows = [
    ["Enterprise", "$620K"],
    ["Mid-market", "$410K"],
    ["SMB", "$210K"],
  ]
  return (
    <div className="text-[11px]">
      <div className="flex justify-between pb-1.5 text-[10px] font-medium" style={{ color: KIT_SUBTLE }}>
        <span>Segment</span>
        <span>ARR</span>
      </div>
      {rows.map(([a, b]) => (
        <div key={a} className="flex justify-between border-t py-1.5" style={{ borderColor: KIT_RULE }}>
          <span>{a}</span>
          <span className="tabular-nums" style={{ color: MUTED }}>
            {b}
          </span>
        </div>
      ))}
    </div>
  )
}

/** ReportUI's green "Win" callout, drawn at the kit's size: the soft green
    card, a circled check beside the bold title, the finding beneath. */
function KitCallout() {
  return (
    <div className="rounded-[11px] px-3 py-2.5" style={{ background: "rgb(237,252,242)", color: "rgb(0,110,45)" }}>
      <div className="flex items-center gap-1.5 text-[12.5px] font-semibold tracking-[-0.2px]">
        <svg viewBox="0 0 24 24" className="size-[14px] shrink-0" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <circle cx="12" cy="12" r="9.25" />
          <path d="m8.25 12.25 2.5 2.5 5-5.25" />
        </svg>
        Win
      </div>
      <p className="mt-1 text-[11px] leading-[1.45]">Net new ARR up 80% across the year.</p>
    </div>
  )
}

/** The kit: the components a report is built from. */
function ComponentKit() {
  return (
    <div className="grid w-full max-w-[38rem] grid-cols-2 gap-x-3 gap-y-5 sm:grid-cols-3">
      <KitTile name="Report header">
        <KitHeader />
      </KitTile>
      <KitTile name="Trend chart">
        <KitTrend />
      </KitTile>
      <KitTile name="KPI card">
        <KitKpi />
      </KitTile>
      <KitTile name="Bar chart">
        <KitBars />
      </KitTile>
      <KitTile name="Table">
        <KitTable />
      </KitTile>
      <KitTile name="Callout">
        <KitCallout />
      </KitTile>
    </div>
  )
}

/* ---------- Readable by an agent ---------- */

const SPECS = {
  KPI: {
    lines: [
      ["component", "kpi"],
      ["use for", "one figure a team tracks over time"],
      ["label", "\"Net New ARR\""],
      ["value", "512000 · currency"],
      ["note", "\"Across 4 quarters\""],
      ["change", "+80% · good when up"],
    ],
    render: (
      // Laid out at the card's size in the report and scaled up, so its type
      // grows with the card instead of the card just getting wider.
      <div className="w-full max-w-[15rem]">
        <Scaled width={200}>
          <Kpi at={0} label="Net New ARR" value="$512K" note="Across 4 quarters" />
        </Scaled>
      </div>
    ),
  },
  Trend: {
    lines: [
      ["component", "trend_chart"],
      ["use for", "a measure across time, with a forecast"],
      ["title", "\"ARR with Forecast\""],
      ["series", "arr, forecast"],
      ["x", "quarter"],
      ["y", "currency"],
    ],
    // A recreation of the ReportUI trend chart, with its forecast.
    render: (
      // Nudged down, clear of the Component | Spec toggle above it; a shift,
      // not a margin, so the panel keeps its height.
      <div className="w-full max-w-[25rem] translate-y-3">
        <Scaled width={440}>
          <ForecastChart />
        </Scaled>
      </div>
    ),
  },
  Callout: {
    lines: [
      ["component", "callout"],
      ["use for", "the one finding a reader shouldn't miss"],
      ["tone", "caution"],
      ["title", "\"Watch\""],
      ["text", "\"SQL conversion has dropped for the second quarter running…\""],
    ],
    render: (
      <div className="w-full max-w-[22rem]">
        <Callout tone="caution" title="Watch" compact>
          SQL conversion has dropped for the second quarter running, from 14% to 11%. Most of the
          drop comes from paid search leads, so start with lead quality there before adding volume.
        </Callout>
      </div>
    ),
  },
} as const

function AgentReadable() {
  const [tab, setTab] = useState<keyof typeof SPECS>("KPI")
  const [view, setView] = useState<"component" | "spec">("component")
  const spec = SPECS[tab]
  const code = view === "spec"
  return (
    <div className="flex w-full max-w-[40rem] flex-col gap-4">
      <div className="flex gap-1">
        {(Object.keys(SPECS) as (keyof typeof SPECS)[]).map((k) => (
          <button
            key={k}
            type="button"
            onClick={() => setTab(k)}
            className={`rounded-[8px] px-2.5 py-1 text-[13px] transition-colors ${
              k === tab ? "bg-[#e6e6e3] font-medium text-[#0f0f0f]" : "text-[#7a7a77] hover:text-[#0f0f0f]"
            }`}
          >
            {k}
          </button>
        ))}
      </div>
      {/* One container, two faces: the component as a reader sees it, or the
          description the agent reads it from. The toggle sits inside, top
          right, and the container holds its height either way. */}
      <div
        className={`relative flex min-h-[23rem] flex-col rounded-[12px] border transition-colors duration-300 ${
          code ? "border-[#23262d] bg-[#23262d]" : "border-[#ebebe9] bg-[#f3f3f2]"
        }`}
      >
        <div
          role="group"
          aria-label="Show"
          className={`absolute top-3 right-3 z-10 flex rounded-[9px] p-0.5 transition-colors duration-300 ${
            code ? "bg-white/10" : "bg-[#e6e6e3]"
          }`}
        >
          {(["component", "spec"] as const).map((v) => {
            const on = v === view
            return (
              <button
                key={v}
                type="button"
                aria-pressed={on}
                onClick={() => setView(v)}
                className={`rounded-[7px] px-2.5 py-0.5 text-[12px] capitalize transition-colors duration-200 ${
                  on
                    ? code
                      ? "bg-white/15 font-medium text-white"
                      : "bg-white font-medium text-[#0f0f0f] shadow-[0_1px_2px_rgba(15,15,15,0.06)]"
                    : code
                      ? "text-[#8b93a3] hover:text-white"
                      : "text-[#7a7a77] hover:text-[#0f0f0f]"
                }`}
              >
                {v}
              </button>
            )
          })}
        </div>

        {code ? (
          <div key={`spec-${tab}`} className="view-in flex flex-1 items-center justify-center px-4 py-11 font-mono text-[12px] leading-[1.7] sm:px-8 sm:leading-[1.9]">
            {/* The spec is centred as a block; its keys and values stay
                left-aligned inside it, so they still line up. */}
            <div className="w-fit max-w-full">
              {spec.lines.map(([k, v]) => (
                // Key above value when narrow, side by side when there's room.
                <div key={k} className="mb-1.5 flex flex-col sm:mb-0 sm:flex-row sm:gap-4">
                  <span className="shrink-0 text-[#8b93a3] sm:w-[5.5rem]">{k}</span>
                  <span className="min-w-0 text-[#e6e8ec]">{v}</span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div key={`component-${tab}`} className="view-in flex flex-1 items-center justify-center px-3 py-11 sm:px-10">
            {spec.render}
          </div>
        )}
      </div>
    </div>
  )
}

/* ---------- Templates ---------- */

/*
 * The templates as the product shows them, from the Vasco home screen's "Put
 * your agents to work": a row of template cards, each naming the template and
 * what it does, with a report sheet rising out of its foot at a slight tilt.
 * The sheets are drawn in the kit's quiet palette (ink, soft greys and one
 * green), small enough that every part sits inside its sheet. Laid out at a
 * fixed size and scaled to the panel.
 */

const TPL_W = 980
const TPL_LINE = "#f0f0ee"
const TPL_EDGE = "#ececea"
const TPL_GREEN = "#3fae7a"

/** A grey placeholder line, standing in for text on a sheet. */
function Skel({ w, h = 5, className = "" }: { w: string; h?: number; className?: string }) {
  return <span className={`block rounded-full ${className}`} style={{ width: w, height: h, background: TPL_LINE }} />
}

/** A small KPI tile on a sheet: a label line, the figure, and its change. */
function SheetKpi({ value, change }: { value: string; change?: string }) {
  return (
    <div className="min-w-0 flex-1 rounded-[8px] border px-2.5 pt-2.5 pb-2" style={{ borderColor: TPL_EDGE }}>
      <Skel w="55%" h={4} />
      <div className="mt-1.5 text-[12.5px] leading-none font-semibold tracking-[-0.2px] tabular-nums">{value}</div>
      <div className="mt-1 h-[9px] text-[8.5px] leading-[9px] font-medium" style={{ color: TPL_GREEN }}>
        {change}
      </div>
    </div>
  )
}

/** A summary paragraph and a soft area chart. */
function SheetSummary() {
  const line =
    "M0 34 C 12 32, 18 16, 30 13 S 44 26, 54 20 S 64 9, 74 14 S 92 29, 104 26 S 116 9, 128 11 S 142 26, 154 22 S 168 10, 180 12 S 194 19, 200 17"
  return (
    <>
      <div className="mt-3.5 text-[9.5px] font-medium" style={{ color: MUTED }}>
        Summary
      </div>
      <Skel w="100%" className="mt-2" />
      <Skel w="72%" className="mt-1.5" />
      <div className="mt-3.5 rounded-[8px] border px-2.5 pt-3 pb-1.5" style={{ borderColor: TPL_EDGE }}>
        <svg viewBox="0 0 200 40" className="block h-[40px] w-full" preserveAspectRatio="none" aria-hidden>
          <defs>
            <linearGradient id="tpl-area" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0" stopColor={TPL_GREEN} stopOpacity="0.18" />
              <stop offset="1" stopColor={TPL_GREEN} stopOpacity="0" />
            </linearGradient>
          </defs>
          <path d={`${line} L200 40 L0 40 Z`} fill="url(#tpl-area)" />
          <path d={line} fill="none" stroke={TPL_GREEN} strokeWidth="1.3" vectorEffect="non-scaling-stroke" />
        </svg>
      </div>
    </>
  )
}

/** A share of total, as a donut with its key, and two figures. */
function SheetShare() {
  const slices = [
    { c: TPL_GREEN, len: 52 },
    { c: "#a8d9c0", len: 28 },
    { c: "#dcdfe2", len: 20 },
  ]
  let offset = 0
  return (
    <>
      <div className="mt-3.5 flex items-center gap-3.5 rounded-[8px] border px-3 py-2.5" style={{ borderColor: TPL_EDGE }}>
        <svg viewBox="0 0 36 36" className="size-[34px] shrink-0 -rotate-90" aria-hidden>
          {slices.map((s) => {
            const el = (
              <circle
                key={s.c}
                cx="18"
                cy="18"
                r="14"
                fill="none"
                stroke={s.c}
                strokeWidth="6"
                pathLength={100}
                strokeDasharray={`${s.len} ${100 - s.len}`}
                strokeDashoffset={-offset}
              />
            )
            offset += s.len
            return el
          })}
        </svg>
        <div className="flex min-w-0 flex-1 flex-col gap-1.5">
          {slices.map((s) => (
            <div key={s.c} className="flex items-center gap-1.5">
              <span className="size-[5px] shrink-0 rounded-full" style={{ background: s.c }} />
              <Skel w="100%" h={4} />
            </div>
          ))}
        </div>
      </div>
      <div className="mt-2.5 flex gap-2">
        <SheetKpi value="$306K" change="↗ 18%" />
        <SheetKpi value="$120K" change="↗ 26%" />
      </div>
    </>
  )
}

/** A small column chart, its tallest bar in green, and three figures. */
function SheetProgress() {
  const bars = [0.42, 0.58, 0.5, 0.74, 1, 0.66, 0.82]
  return (
    <>
      <div className="mt-3.5 rounded-[8px] border px-3 py-3" style={{ borderColor: TPL_EDGE }}>
        <div className="flex h-[34px] items-end gap-[5px]">
          {bars.map((v, i) => (
            <span
              key={i}
              className="flex-1 rounded-t-[3px]"
              style={{ height: `${v * 100}%`, background: v === 1 ? TPL_GREEN : "#d9dcdf" }}
            />
          ))}
        </div>
      </div>
      <div className="mt-2.5 flex gap-2">
        <SheetKpi value="$400K" change="↗ 12%" />
        <SheetKpi value="91%" change="↗ 4pp" />
        <SheetKpi value="11d" change="↗ 2d" />
      </div>
    </>
  )
}

/** The templates: each named for the report it makes, and that report's sheet. */
const TEMPLATES: { title: string; blurb: string; sheet: React.ReactNode }[] = [
  {
    title: "ICP & TAM Discovery",
    blurb: "Validates your Ideal Customer Profile against real deal outcomes and sizes the market it points to.",
    sheet: <SheetShare />,
  },
  {
    title: "Weekly Pipeline Review",
    blurb: "New pipeline, win rate and slipped deals each week, so the team sees what moved and why.",
    sheet: <SheetSummary />,
  },
  {
    title: "Monthly Revenue Health",
    blurb: "ARR, retention and payback month by month, with the drivers behind each change.",
    sheet: <SheetProgress />,
  },
]

function TemplateCard({ title, blurb, sheet }: (typeof TEMPLATES)[number]) {
  return (
    // A step lighter than the panel, with a hairline edge. On hover the sheet
    // rises and straightens a little inside it, then settles back.
    <div
      className="group relative h-[300px] min-w-0 flex-1 overflow-hidden rounded-[16px] border px-5 pt-5"
      style={{ background: "#fbfbfa", borderColor: "#efefed" }}
    >
      <div className="text-[13.5px] font-semibold tracking-[-0.1px]">{title}</div>
      <p className="mt-1.5 line-clamp-2 text-[12px] leading-[1.5]" style={{ color: "#6b7280" }}>
        {blurb}
      </p>
      {/* The report the template makes, rising out of the card at a slight
          tilt and running off its foot. */}
      <div
        className="tpl-sheet absolute top-[124px] right-[38px] left-[46px] rounded-[11px] border bg-white px-4 pt-4 pb-14 shadow-[0_1px_2px_rgba(15,15,15,0.03),0_8px_20px_-10px_rgba(15,15,15,0.12)]"
        style={{ borderColor: TPL_EDGE }}
      >
        <div className="text-[12.5px] leading-tight font-semibold tracking-[-0.15px]">{title}</div>
        <Skel w="60%" className="mt-2" />
        {sheet}
      </div>
    </div>
  )
}

function TemplateGallery() {
  return (
    <div className="w-full max-w-[40rem]">
      <Scaled width={TPL_W}>
        <div className={`${FONT} pt-1 pb-2`} style={{ color: INK }}>
          <div className="flex items-center justify-between">
            <span className="text-[14.5px] font-medium">Put your agents to work</span>
            <span className="flex items-center gap-1.5 text-[12.5px] font-medium" style={{ color: "#4b5160" }}>
              <Store strokeWidth={2} className="size-[13px]" aria-hidden />
              Go to marketplace
            </span>
          </div>
          <div className="mt-5 flex gap-5">
            {TEMPLATES.map((t) => (
              <TemplateCard key={t.title} {...t} />
            ))}
          </div>
        </div>
      </Scaled>
    </div>
  )
}

/* ---------- Key decisions: same shape, fresh numbers ---------- */

const RUNS = [
  { date: "2026-10-05", kpis: ["$412K", "31%", "38d"], deltas: ["+12%", "+2pp", "+4d"], trend: [0.2, 0.35, 0.3, 0.5, 0.45, 0.62, 0.7] },
  { date: "2026-10-12", kpis: ["$390K", "30%", "41d"], deltas: ["−5%", "−1pp", "+3d"], trend: [0.35, 0.3, 0.5, 0.45, 0.62, 0.7, 0.58] },
  { date: "2026-10-19", kpis: ["$468K", "33%", "36d"], deltas: ["+20%", "+3pp", "−5d"], trend: [0.3, 0.5, 0.45, 0.62, 0.7, 0.58, 0.8] },
]

function RecurringRuns() {
  const [i, setI] = useState(0)
  const run = RUNS[i]!
  const labels = ["New pipeline", "Win rate", "Cycle"]
  return (
    <div className="flex w-full max-w-[30rem] flex-col gap-4">
      <div className="flex gap-1">
        {RUNS.map((r, j) => (
          <button
            key={r.date}
            type="button"
            onClick={() => setI(j)}
            className={`rounded-[8px] px-2.5 py-1 text-[13px] tabular-nums transition-colors ${
              j === i ? "bg-[#e6e6e3] font-medium text-[#0f0f0f]" : "text-[#7a7a77] hover:text-[#0f0f0f]"
            }`}
          >
            {r.date}
          </button>
        ))}
      </div>
      <Sheet className="p-5">
        <RunHeader title="Weekly pipeline review" date={run.date} />
        {/* Keyed by run, so each run's numbers fade in over the same layout. */}
        <div key={run.date} className="view-in">
          <div className="mt-3 flex gap-2">
            {labels.map((l, j) => (
              <MiniKpi
                key={l}
                label={l}
                value={run.kpis[j]!}
                delta={run.deltas[j]!}
                down={j === 2 ? !run.deltas[j]!.startsWith("−") : run.deltas[j]!.startsWith("−")}
              />
            ))}
          </div>
          <ChartCard title="Pipeline created, by week" figure="Last 7 weeks">
            <MiniTrend values={run.trend} className="mt-1.5 h-[54px]" />
          </ChartCard>
        </div>
      </Sheet>
    </div>
  )
}

/* ---------- Learnings: output fatigue ---------- */

const INBOX = [
  { title: "Weekly pipeline review", date: "2026-10-19" },
  { title: "Daily signups", date: "2026-10-19" },
  { title: "Team scorecard", date: "2026-10-18" },
  { title: "Monthly revenue health", date: "2026-10-17" },
  { title: "ICP analysis", date: "2026-10-16" },
  { title: "Daily signups", date: "2026-10-16" },
]

/** A week's reports side by side: the same shape, the same wall of text. */
function ReportFatigue() {
  const line = "h-[4px] rounded-full bg-[#ebebe9]"
  /* When the panel is narrow the note spans nearly its width, so any arrow
     would cross it: there the note stands alone, centred. */
  const ref = useRef<HTMLDivElement>(null)
  const [wide, setWide] = useState(true)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const ro = new ResizeObserver(() => setWide(el.clientWidth >= 460))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])
  return (
    <div ref={ref} className="relative w-full max-w-[38rem] pt-12">
      {wide ? (
        <ScribbleNote key="wide" target="[data-fatigue-target]" className="top-0 right-2 sm:right-6">
          Which one do I read?
        </ScribbleNote>
      ) : (
        <ScribbleNote key="narrow" target={null} className="top-0 left-1/2 -translate-x-1/2">
          Which one do I read?
        </ScribbleNote>
      )}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {INBOX.map((r, i) => (
          <Sheet key={i} className="p-3.5">
            {/* The note points at the second card, which is in the top row
                at every width. Dates give way when the cards are narrow. */}
            <div className="flex items-baseline justify-between gap-2">
              <span data-fatigue-target={i === 1 ? "" : undefined} className="min-w-0 text-[11px] leading-tight font-semibold">
                {r.title}
              </span>
              <span className="hidden shrink-0 text-[9px] tabular-nums sm:inline" style={{ color: MUTED }}>
                {r.date.slice(5)}
              </span>
            </div>
            {/* Three KPI tiles, drawn as placeholders: a label line over a
                darker figure bar, in the report kit's quiet tiles. */}
            <div className="mt-2.5 flex gap-1">
              {[60, 45, 55].map((w, j) => (
                <span
                  key={j}
                  className="flex flex-1 flex-col gap-[4px] rounded-[5px] border bg-[#fafaf9] px-1.5 pt-1.5 pb-[7px]"
                  style={{ borderColor: "#efefed" }}
                >
                  <span className="h-[3px] w-[70%] rounded-full bg-[#e6e6e4]" />
                  <span className="h-[5px] rounded-full bg-[#d4d4d1]" style={{ width: `${w}%` }} />
                </span>
              ))}
            </div>
            {/* The same wall of text in every one: two paragraphs. */}
            <div className="mt-2.5 flex flex-col gap-[5px]">
              {[100, 94, 97, 62].map((w, j) => (
                <span key={j} className={line} style={{ width: `${w}%` }} />
              ))}
            </div>
            <div className="mt-[9px] flex flex-col gap-[5px]">
              {[96, 88, 74].map((w, j) => (
                <span key={j} className={line} style={{ width: `${w}%` }} />
              ))}
            </div>
          </Sheet>
        ))}
      </div>
    </div>
  )
}

/* ---------- Outcome: the hero, building ---------- */

/** The hero's report, which starts building once it's scrolled into view
    rather than playing unseen when the page loads. */
function BuildingReport() {
  const ref = useRef<HTMLDivElement>(null)
  const [seen, setSeen] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const io = new IntersectionObserver(
      ([e]) => {
        if (e?.isIntersecting) {
          setSeen(true)
          io.disconnect()
        }
      },
      { threshold: 0.4 },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [])
  return (
    <div ref={ref} className="aspect-[16/10] w-full">
      {seen && <ReportUIHero />}
    </div>
  )
}

export const ARTIFACTS_CASE: CaseStudy = {
  title: "Artifacts",
  summary:
    "Made recurring reporting effortless by generating tailored, template-backed reports users can customize, share, and regenerate on demand.",
  facts: [
    { label: "Company", value: "Vasco" },
    { label: "Role", value: "Senior Product Designer" },
    { label: "Team", value: "Me and 1 engineer" },
    { label: "Timeline", value: "2026-07" },
  ],
  hero: <ArtifactsHero />,
  sections: [
    {
      id: "problem",
      label: "Problem",
      title: "A report is only useful if it comes back the same",
      blurb: [
        "Teams wanted reports they could come back to: a weekly pipeline review, a daily check on signups, a monthly look at revenue health. A recurring report is how they share progress with teammates, track their numbers and surface the information they need, on a cadence they choose.",
        "But an agent left to itself writes a different report every time. Ask for the same weekly review twice and the second can come back with the chart gone, the numbers folded into a paragraph and the sections in a new order. For a report to recur, its output has to be predictable and consistent.",
      ],
      media: {
        kind: "demo",
        caption: "One request, two Mondays, two reports.",
        node: <DriftingReports />,
      },
    },
    {
      id: "role",
      label: "My role",
      title: "Designing for an agent, as well as for a person",
      blurb: [
        "The big challenge was designing for agents: a report the agent generates has to reflect what the user wants to see and the data it's pulling, every time. My answer was to stop the agent from inventing layouts and give it something to build from instead.",
        "I designed a group of report components an agent could read and pull from: headers, KPI cards, trend and bar charts, tables and callouts. Each one is a fixed, designed piece, so the same kind of data always lands in the same shape, and the user has the whole kit to choose from.",
      ],
      media: {
        kind: "demo",
        caption: "The kit a report is built from.",
        node: <ComponentKit />,
      },
    },
    {
      id: "readable",
      label: "For agents",
      title: "Every component, written for the agent to read",
      blurb: [
        "A component an agent can use has to be described as well as drawn. Each one carries what it's for and the fields it takes, so the agent can match the data it has to the component made for it: a figure a team tracks to a KPI card, a measure over time to a trend chart, a finding to a callout.",
      ],
      media: {
        kind: "demo",
        caption: "Each component, as drawn and as read.",
        interactive: true,
        node: <AgentReadable />,
      },
    },
    {
      id: "templates",
      label: "Templates",
      title: "Templates, for a head start",
      blurb: [
        "On top of the kit, we created a library of templates: complete reports, built from the same components, for the reports teams ask for most. Users can pull one in as it is, use it for inspiration, or customize it whatever way they want.",
      ],
      media: {
        kind: "demo",
        caption: "Templates, as the product offers them.",
        interactive: true,
        node: <TemplateGallery />,
      },
    },
    {
      id: "decisions",
      label: "Key decisions",
      title: "Same shape, fresh numbers",
      blurb: [
        "Build from a kit, not from scratch. The agent assembles reports from designed components rather than generating layout freely. That's what makes output predictable: the structure is decided once, and every run fills it with new data.",
        "Templates are starting points, not cages. They give users a fast way in and ideas for what a good report contains, but every part of one can be changed, added to or removed.",
        "The user decides what a report is. The kit is shared by the agent and the user, so whatever the user customizes, the agent can regenerate on the next run without losing it.",
      ],
      media: {
        kind: "demo",
        caption: "One report, three runs: same shape, new numbers.",
        interactive: true,
        node: <RecurringRuns />,
      },
    },
    {
      id: "outcome",
      label: "Outcome",
      title: "Our agents’ most-used output",
      blurb: [
        "Artifacts became the output our agents produce more than any other, and one of the pillars of the product. It's how much of Vasco's value reaches the people who use it: a report on their own cadence, in the shape they set up, ready to share with their team.",
        "The kit and the templates did what they were built to do. The same report comes back the same way, run after run, so teams can rely on it and build a habit around it.",
      ],
      media: {
        kind: "demo",
        caption: "A report, built from the kit.",
        bleed: true,
        node: <BuildingReport />,
      },
    },
    {
      id: "learnings",
      label: "Learnings",
      title: "Consistency, taken too far, reads as noise",
      blurb: [
        "Success brought a new problem. Teams now receive so many generated reports that they've started to tune them out: one report looks much like the next, and most of each is text. We're seeing a kind of AI output fatigue, where the outputs are there but no longer read.",
        "If I took this on again, I'd design for distinction as well as consistency. Each report would keep its own structure from run to run, but take more of its shape from its subject: components and layouts suited to what it covers, more room to customize by topic, and less text. Reports that look as different as the questions they answer are easier to tell apart, and more likely to be read.",
      ],
      media: {
        kind: "demo",
        caption: "A week of reports, hard to tell apart.",
        node: <ReportFatigue />,
      },
    },
  ],
}
