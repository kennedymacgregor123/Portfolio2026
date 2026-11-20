import { useEffect, useRef, useState } from "react"

import type { CaseStudy } from "./case-study"
import { TrendingDown, TrendingUp } from "lucide-react"

import { INK, Kpi, LINE, MUTED, ReportUIHero } from "./reportui-hero"
import { BarChart, Callout, DataTable, ForecastChart, KpiCard, LineChart, ReportHeader, Scaled } from "./report-kit"
import { ScribbleNote } from "./scribble-note"

/*
 * The Artifacts case study: recurring, agent-generated reports built from a
 * kit of report components and a library of templates. The panels are drawn
 * in the same style as the hero's report. Figures in them are invented.
 */

const FONT = "font-['Inter_Variable',Inter,sans-serif]"

/** A report page, as the panels show one. */
function Sheet({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={`rounded-[12px] border bg-[#fbfbfa] shadow-[0_1px_2px_rgba(15,15,15,0.04),0_10px_30px_-14px_rgba(15,15,15,0.1)] ${FONT} ${className}`}
      style={{ borderColor: LINE, color: INK }}
    >
      {children}
    </div>
  )
}

function MiniKpi({ label, value, delta, down }: { label: string; value: string; delta: string; down?: boolean }) {
  return (
    <div className="min-w-0 flex-1 rounded-[8px] border bg-white px-2.5 py-2" style={{ borderColor: "#e8e8e6" }}>
      <div className="truncate text-[10px]" style={{ color: MUTED }}>{label}</div>
      <div className="mt-0.5 text-[15px] leading-tight font-semibold tabular-nums">{value}</div>
      <span
        className="mt-1 inline-flex items-center gap-1 rounded-[4px] px-1 py-px text-[9px] font-medium tabular-nums"
        style={down ? { background: "#fbe9e9", color: "#c2453d" } : { background: "#e6f4ec", color: "#2f855a" }}
      >
        {down ? <TrendingDown strokeWidth={2.25} className="size-[8px]" aria-hidden /> : <TrendingUp strokeWidth={2.25} className="size-[8px]" aria-hidden />}
        {delta}
      </span>
    </div>
  )
}

/** A small area chart, from a list of values between 0 and 1. */
function MiniTrend({ values, className = "h-[56px]" }: { values: number[]; className?: string }) {
  const step = 200 / (values.length - 1)
  const pts = values.map((v, i) => `${(i * step).toFixed(1)} ${(54 - v * 48).toFixed(1)}`)
  const line = `M${pts.join(" L")}`
  return (
    <svg viewBox="0 0 200 56" className={`block w-full ${className}`} preserveAspectRatio="none" aria-hidden>
      {[6, 30, 54].map((y) => (
        <line key={y} x1="0" x2="200" y1={y} y2={y} stroke="#ececea" strokeDasharray="3 3" />
      ))}
      <path d={`${line} L200 56 L0 56 Z`} fill="#3fae7a" fillOpacity="0.1" />
      <path d={line} fill="none" stroke="#3fae7a" strokeWidth="1.4" vectorEffect="non-scaling-stroke" />
    </svg>
  )
}

function RunHeader({ title, date }: { title: string; date: string }) {
  return (
    <div className="flex items-baseline justify-between gap-2">
      <span className="text-[13px] font-semibold">{title}</span>
      <span className="shrink-0 rounded-[5px] bg-[#efefed] px-1.5 py-0.5 text-[10px] tabular-nums" style={{ color: MUTED }}>
        {date}
      </span>
    </div>
  )
}

/* ---------- Problem: the same prompt, two different reports ---------- */

function DriftingReports() {
  return (
    <div className="relative w-full max-w-[38rem] pt-14">
      <ScribbleNote target="[data-drift-run]" className="top-0 right-2 sm:right-6">
        Same request??
      </ScribbleNote>
      <div className="flex flex-col gap-4 sm:flex-row">
        <Sheet className="flex-1 p-4">
          <RunHeader title="Weekly pipeline review" date="2026-10-05" />
          <div className="mt-3 flex gap-2">
            <MiniKpi label="New pipeline" value="$412K" delta="+12%" />
            <MiniKpi label="Win rate" value="31%" delta="+2pp" />
            <MiniKpi label="Cycle" value="38d" delta="+4d" down />
          </div>
          <div className="mt-3 rounded-[8px] border bg-white px-2.5 pt-2 pb-1.5" style={{ borderColor: "#e8e8e6" }}>
            <div className="text-[10px] font-medium">Pipeline created, by week</div>
            <MiniTrend values={[0.2, 0.35, 0.3, 0.5, 0.45, 0.62, 0.7]} className="mt-1 h-[48px]" />
          </div>
        </Sheet>
        {/* The next run of the same request: the chart gone, the KPIs
            folded into prose, the sections in a new order. */}
        <Sheet className="flex-1 p-4">
          {/* The note's arrow lands on the title, which is all that's
              left of the first report's name. */}
          <div className="flex items-baseline justify-between gap-2">
            <span data-drift-run className="text-[13px] font-semibold">Pipeline update</span>
            <span className="shrink-0 rounded-[5px] bg-[#efefed] px-1.5 py-0.5 text-[10px] tabular-nums" style={{ color: MUTED }}>
              2026-10-12
            </span>
          </div>
          <p className="mt-3 text-[11.5px] leading-[1.5]" style={{ color: "#3b4150" }}>
            This week the team added roughly $390K in new pipeline. Win rate is around 30%, and
            deals are taking a little longer to close than last week.
          </p>
          <div className="mt-3 text-[10px] font-semibold tracking-[0.3px] uppercase" style={{ color: MUTED }}>
            Top deals
          </div>
          <ul className="mt-1.5 flex flex-col gap-1 text-[11.5px]" style={{ color: "#3b4150" }}>
            <li className="flex justify-between"><span>Northwind renewal</span><span className="tabular-nums">$84K</span></li>
            <li className="flex justify-between"><span>Acme expansion</span><span className="tabular-nums">$61K</span></li>
            <li className="flex justify-between"><span>Globex, new logo</span><span className="tabular-nums">$47K</span></li>
          </ul>
        </Sheet>
      </div>
    </div>
  )
}

/* ---------- The kit ---------- */

function KitTile({ name, width, children }: { name: string; width: number; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex min-h-[92px] flex-1 flex-col justify-center rounded-[10px] border bg-[#fbfbfa] p-3" style={{ borderColor: LINE }}>
        <Scaled width={width}>{children}</Scaled>
      </div>
      <span className="project-blurb text-center !text-[12px]">{name}</span>
    </div>
  )
}

/** The kit: each tile a hand-built recreation of the component, laid out at
    its design width and scaled into the tile. */
function ComponentKit() {
  return (
    <div className="grid w-full max-w-[38rem] grid-cols-2 gap-x-3 gap-y-4 sm:grid-cols-3">
      <KitTile name="Report header" width={420}>
        <ReportHeader title="Weekly Retro — Jun 23" meta={[{ label: "Period", value: "Jun 16–22" }]} />
      </KitTile>
      <KitTile name="KPI card" width={240}>
        <KpiCard label="Total ARR" value="$1.19M" note="vs $968K last quarter" change="+23%" />
      </KitTile>
      <KitTile name="Trend chart" width={420}>
        <LineChart />
      </KitTile>
      <KitTile name="Bar chart" width={420}>
        <BarChart />
      </KitTile>
      <KitTile name="Table" width={420}>
        <DataTable
          columns={["Stage", "Count", "Value"]}
          rows={[
            ["Lead", "512", "$6.1M"],
            ["MQL", "204", "$3.9M"],
            ["SQL", "87", "$2.48M"],
            ["Opportunity", "31", "$890K"],
          ]}
        />
      </KitTile>
      <KitTile name="Callout" width={300}>
        <Callout tone="caution" title="Watch">
          MQL attainment at 82% — monitor closely next week.
        </Callout>
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
      <div className="w-full max-w-[15rem]">
        <Kpi at={0} label="Net New ARR" value="$512K" note="Across 4 quarters" />
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
      <div className="w-full max-w-[25rem]">
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
        className={`relative flex min-h-[25.5rem] flex-col rounded-[12px] border transition-colors duration-300 ${
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

const TEMPLATES: { name: string; cadence: string; layout: ("kpis" | "chart" | "text" | "table" | "bars")[] }[] = [
  { name: "Daily signups", cadence: "Daily", layout: ["kpis", "chart"] },
  { name: "Weekly pipeline review", cadence: "Weekly", layout: ["kpis", "chart", "table"] },
  { name: "Monthly revenue health", cadence: "Monthly", layout: ["text", "kpis", "chart"] },
  { name: "ICP analysis", cadence: "Quarterly", layout: ["text", "bars", "table"] },
  { name: "Team scorecard", cadence: "Weekly", layout: ["kpis", "table"] },
  { name: "Board update", cadence: "Quarterly", layout: ["text", "kpis", "bars"] },
]

function TemplateThumb({ layout }: { layout: (typeof TEMPLATES)[number]["layout"] }) {
  const block = "rounded-[3px] bg-[#e7e7e5]"
  return (
    <div className="flex flex-col gap-1.5 rounded-[8px] border bg-[#fbfbfa] p-2.5" style={{ borderColor: LINE }}>
      <span className={`${block} h-[6px] w-1/2 !bg-[#d9d9d6]`} />
      {layout.map((part, i) =>
        part === "kpis" ? (
          <div key={i} className="flex gap-1">
            {[0, 1, 2].map((j) => (
              <span key={j} className="h-[16px] flex-1 rounded-[3px] border bg-white" style={{ borderColor: "#e8e8e6" }} />
            ))}
          </div>
        ) : part === "chart" ? (
          <div key={i} className="rounded-[3px] border bg-white px-1 pt-1" style={{ borderColor: "#e8e8e6" }}>
            <MiniTrend values={[0.2, 0.35, 0.3, 0.5, 0.55, 0.7]} className="h-[20px]" />
          </div>
        ) : part === "bars" ? (
          <div key={i} className="flex h-[22px] items-end gap-1">
            {[0.5, 0.8, 0.4, 0.9, 0.6].map((h, j) => (
              <span key={j} className="flex-1 rounded-t-[2px] bg-[#c4d0f8]" style={{ height: `${h * 100}%` }} />
            ))}
          </div>
        ) : part === "table" ? (
          <div key={i} className="flex flex-col gap-1">
            {[0, 1, 2].map((j) => (
              <span key={j} className={`${block} h-[4px]`} />
            ))}
          </div>
        ) : (
          <div key={i} className="flex flex-col gap-1">
            <span className={`${block} h-[4px]`} />
            <span className={`${block} h-[4px] w-4/5`} />
          </div>
        ),
      )}
    </div>
  )
}

function TemplateGallery() {
  return (
    <div className="grid w-full max-w-[38rem] grid-cols-2 gap-x-3 gap-y-4 sm:grid-cols-3">
      {TEMPLATES.map((t) => (
        <div key={t.name} className="flex flex-col gap-2">
          <TemplateThumb layout={t.layout} />
          <div className="flex items-center justify-between gap-2">
            <span className="project-blurb truncate !text-[12px] !text-[#0f0f0f]">{t.name}</span>
            <span className="shrink-0 rounded-full bg-[#e6e6e3] px-1.5 py-px text-[10px] text-[#4a4a4a]">{t.cadence}</span>
          </div>
        </div>
      ))}
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
          <div className="mt-3 rounded-[8px] border bg-white px-2.5 pt-2 pb-1.5" style={{ borderColor: "#e8e8e6" }}>
            <div className="text-[10px] font-medium">Pipeline created, by week</div>
            <MiniTrend values={run.trend} className="mt-1 h-[56px]" />
          </div>
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
  const line = "h-[4px] rounded-full bg-[#e3e3e1]"
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
          <Sheet key={i} className="p-3">
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
            <div className="mt-2 flex gap-1">
              {[0, 1, 2].map((j) => (
                <span key={j} className="h-[18px] flex-1 rounded-[4px] border bg-white" style={{ borderColor: "#e8e8e6" }} />
              ))}
            </div>
            <div className="mt-2 flex flex-col gap-[5px]">
              {[100, 92, 97, 85, 95, 70].map((w, j) => (
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
    { label: "Role", value: "Senior Product Designer" },
    { label: "Team", value: "Me and 1 engineer" },
    { label: "Timeline", value: "2026-07" },
    { label: "Company", value: "Vasco" },
  ],
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
        caption: "The same request on two Mondays, and two different reports. Invented figures.",
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
        caption: "The kit: the components a report is built from, by the agent or by the user.",
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
        caption: "Each component as the reader sees it, or as the agent reads it. Switch components, then toggle to its spec.",
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
        caption: "A few of the templates, each with the cadence it's made for.",
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
        caption: "One recurring report across three runs: the layout holds, the numbers update. Invented figures.",
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
        caption: "A report building from the kit, as the agent writes it.",
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
        caption: "A week of reports: consistent, and hard to tell apart. Invented titles.",
        node: <ReportFatigue />,
      },
    },
  ],
}
