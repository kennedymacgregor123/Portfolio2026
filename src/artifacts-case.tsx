import { useEffect, useId, useRef, useState } from "react"

import type { CaseStudy } from "./case-study"
import { Activity, CalendarClock, ChartColumn, ChartSpline, FileText, Gauge, Lightbulb, Store, Table2, Target, TrendingDown, TrendingUp } from "lucide-react"

import { INK, Kpi, LINE, Meta, MUTED, ReportUIHero, WinRateChart } from "./reportui-hero"
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
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
        {/* The first run, as an agent styled it with nothing to go on: the
            familiar generated look. Not ugly, just too much: a gradient
            header with an emoji, a different pastel card for every figure,
            gradient bars, and an "AI insight" box nobody asked for. */}
        <div className="flex flex-1">
          <div
            className={`flex-1 overflow-hidden rounded-[16px] border bg-white shadow-[0_10px_30px_-12px_rgba(79,70,229,0.35)] ${FONT}`}
            style={{ borderColor: "#e0e7ff", color: "#1e1b4b" }}
          >
            <div className="px-3.5 py-2.5" style={{ background: "linear-gradient(120deg, #6366f1, #a855f7 60%, #ec4899)" }}>
              <div className="text-[12.5px] font-bold text-white">📊 Weekly Pipeline Review</div>
              <div className="mt-0.5 text-[9px] text-white/80">2026-10-05 · Sales overview</div>
            </div>
            <div className="p-3">
              <div className="flex gap-1.5">
                {[
                  ["💰", "Pipeline", "$412K", "#eef2ff", "#4f46e5"],
                  ["🎯", "Win rate", "31%", "#ecfdf5", "#059669"],
                  ["⏱️", "Cycle", "38d", "#fff7ed", "#ea580c"],
                ].map(([e, l, v, bg, c]) => (
                  <div key={l} className="min-w-0 flex-1 rounded-[10px] px-2 py-1.5" style={{ background: bg }}>
                    <div className="truncate text-[8.5px] font-medium" style={{ color: c }}>
                      {e} {l}
                    </div>
                    <div className="text-[14px] font-extrabold" style={{ color: c }}>{v}</div>
                  </div>
                ))}
              </div>
              <div className="mt-2 rounded-[10px] border px-2 pt-1.5 pb-1" style={{ borderColor: "#eef2ff" }}>
                <div className="text-[9.5px] font-semibold">📈 Pipeline Growth Trend</div>
                <div className="mt-1 flex h-[38px] items-end gap-[4px]">
                  {[0.35, 0.55, 0.45, 0.7, 0.62, 0.85, 0.95].map((v, k) => (
                    <span key={k} className="flex-1 rounded-t-[4px]" style={{ height: `${v * 100}%`, background: "linear-gradient(#a855f7, #6366f1)" }} />
                  ))}
                </div>
              </div>
              <div className="mt-2 rounded-[10px] px-2 py-1.5 text-[9px] leading-[1.4]" style={{ background: "linear-gradient(120deg, #fdf4ff, #eef2ff)", color: "#6b21a8" }}>
                <b>✨ AI Insight:</b> Pipeline is trending up! Keep up the momentum 🚀
              </div>
            </div>
          </div>
        </div>
        {/* The next run of the same request, styled all over again: a
            different gradient, a donut instead of bars, the figures moved
            into the prose as coloured pills, and a deals list in badges. */}
        <div className={`relative flex flex-1 flex-col ${wide ? "" : "pt-12"}`}>
          {!wide && note}
          <div className="flex flex-1">
            <div
              className={`flex-1 overflow-hidden rounded-[12px] border bg-white p-3.5 shadow-[0_10px_30px_-12px_rgba(13,148,136,0.35)] ${FONT}`}
              style={{ borderColor: "#ccfbf1", color: "#134e4a" }}
            >
              {/* The note's arrow lands on the title, which no longer
                  matches the first report's name, or its style. */}
              <div className="flex items-center justify-between gap-2">
                <span
                  data-drift-run
                  className="bg-clip-text text-[14px] font-extrabold text-transparent"
                  style={{ backgroundImage: "linear-gradient(90deg, #0d9488, #2563eb)" }}
                >
                  🚀 Pipeline Update
                </span>
                <span className="rounded-full px-1.5 py-[1px] text-[8.5px] font-semibold" style={{ background: "#ccfbf1", color: "#0f766e" }}>
                  2026-10-12
                </span>
              </div>
              <p className="mt-2 text-[10px] leading-[1.6]" style={{ color: "#475569" }}>
                Great week! 🎉 The team added{" "}
                <span className="rounded-[4px] px-1 font-semibold" style={{ background: "#dbeafe", color: "#1d4ed8" }}>$390K</span> in new pipeline,
                win rate is around{" "}
                <span className="rounded-[4px] px-1 font-semibold" style={{ background: "#dcfce7", color: "#15803d" }}>30%</span> and deals are
                taking a little longer to close.
              </p>
              <div className="mt-2 flex items-center gap-2.5">
                <span
                  aria-hidden
                  className="relative size-[40px] shrink-0 rounded-full"
                  style={{ background: "conic-gradient(#14b8a6 0 38%, #3b82f6 0 64%, #a78bfa 0 84%, #f472b6 0)" }}
                >
                  <span className="absolute inset-[9px] rounded-full bg-white" />
                </span>
                <div className="flex flex-wrap gap-1 text-[8.5px] font-medium">
                  {[
                    ["#14b8a6", "Inbound"],
                    ["#3b82f6", "Outbound"],
                    ["#a78bfa", "Partner"],
                    ["#f472b6", "Events"],
                  ].map(([c, l]) => (
                    <span key={l} className="flex items-center gap-1 rounded-full px-1.5 py-[1px]" style={{ background: "#f8fafc", color: "#475569" }}>
                      <span className="size-[5px] rounded-full" style={{ background: c }} />
                      {l}
                    </span>
                  ))}
                </div>
              </div>
              <div className="mt-2.5 text-[9.5px] font-bold">🔥 Top Deals</div>
              <ul className="mt-1 flex flex-col gap-1 text-[9.5px]">
                {[
                  ["Northwind", "$84K", "Hot 🔥", "#fee2e2", "#b91c1c"],
                  ["Acme", "$61K", "On track", "#dcfce7", "#15803d"],
                  ["Globex", "$47K", "At risk", "#fef3c7", "#b45309"],
                ].map(([deal, amount, tag, bg, c]) => (
                  <li key={deal} className="flex items-center gap-1.5 rounded-[8px] px-1.5 py-1" style={{ background: "#f8fafc" }}>
                    <span
                      className="flex size-[14px] items-center justify-center rounded-full text-[7.5px] font-bold text-white"
                      style={{ background: "linear-gradient(135deg, #14b8a6, #6366f1)" }}
                    >
                      {deal![0]}
                    </span>
                    <span className="flex-1 font-medium">{deal}</span>
                    <span className="rounded-full px-1.5 text-[8px] font-semibold" style={{ background: bg, color: c }}>{tag}</span>
                    <span className="font-bold">{amount}</span>
                  </li>
                ))}
              </ul>
            </div>
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

/**
 * One component of the kit, shown the way a product's gallery shows one: a
 * white card with a small icon tile and the component's name, over a soft
 * inset panel where the specimen sits. Specimens are placed off-centre and
 * allowed to run past the panel's edge, fading out as they go, so each reads
 * as a glimpse of the real thing rather than a boxed-up icon.
 */
export function KitTile({ name, icon, children }: { name: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div
      className={`kit-card flex flex-col gap-2.5 rounded-[14px] border bg-white p-2 ${FONT}`}
      style={{ borderColor: "#ececea", color: INK }}
    >
      <div className="flex items-center gap-2 px-1 pt-1">
        <span
          className="flex size-[22px] shrink-0 items-center justify-center rounded-[6px] border bg-white"
          style={{ borderColor: "#ececea", color: KIT_GREEN }}
          aria-hidden
        >
          {icon}
        </span>
        <span className="truncate text-[12px] font-medium">{name}</span>
      </div>
      <div className="relative h-[104px] overflow-hidden rounded-[10px] border" style={{ background: "#f7f7f6", borderColor: "#f0f0ee" }}>
        {children}
      </div>
    </div>
  )
}

/** A faint grid on a panel, fading out from its middle. */
function KitGrid() {
  return <span aria-hidden className="kit-grid pointer-events-none absolute inset-0" />
}

/** A small white sheet inside a panel: set in from the top left, running off
    the right and bottom, and fading as it goes. */
function KitSheet({ children, className = "", fit = false }: { children: React.ReactNode; className?: string; fit?: boolean }) {
  // `fit` keeps the sheet inside the panel's width, fading only at the foot,
  // for specimens whose right-hand side carries the figures.
  return (
    <div className={`absolute top-3 left-3 ${fit ? "kit-fade-b right-3" : "kit-fade"} ${className}`}>
      <div
        className="rounded-[9px] border bg-white shadow-[0_1px_2px_rgba(15,15,15,0.04),0_8px_20px_-12px_rgba(15,15,15,0.14)]"
        style={{ borderColor: "#ececea" }}
      >
        {children}
      </div>
    </div>
  )
}

/** A small eyebrow inside a specimen, naming what it shows. */
function KitLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-[10px] leading-none font-medium" style={{ color: KIT_SUBTLE }}>
      {children}
    </div>
  )
}

function KitHeader() {
  return (
    <KitSheet className="w-[210px]">
      <div className="px-3 pt-3 pb-4">
        <KitLabel>Vasco</KitLabel>
        <div className="mt-1.5 text-[16px] leading-tight font-semibold tracking-[-0.3px]">ICP Analysis</div>
        <div className="mt-2.5 flex text-[10px]">
          {[
            ["Period", "Q4 FY26"],
            ["Score", "6.4/10"],
            ["Bottleneck", "Demand gen"],
          ].map(([k, v], i) => (
            <div key={k} className={i ? "border-l px-2.5" : "pr-2.5"} style={{ borderColor: KIT_RULE }}>
              <div style={{ color: KIT_SUBTLE }}>{k}</div>
              <div className="mt-0.5 font-semibold whitespace-nowrap">{v}</div>
            </div>
          ))}
        </div>
      </div>
    </KitSheet>
  )
}

export function KitKpi() {
  return (
    // In the single column the tile is wide; keep the card card-sized there.
    <KitSheet fit className="max-sm:right-auto max-sm:w-[12rem]">
      <div className="px-3 pt-2.5 pb-4">
        <KitLabel>Net New ARR</KitLabel>
        <div className="mt-1.5 text-[20px] leading-none font-semibold tracking-[-0.4px] tabular-nums">$512K</div>
        <div className="mt-1 text-[10px]" style={{ color: KIT_SUBTLE }}>
          Across 4 quarters
        </div>
        <span
          className="mt-1.5 inline-flex w-fit items-center gap-1 rounded-full px-1.5 py-0.5 text-[9.5px] font-medium tabular-nums"
          style={{ background: KIT_GREEN_SOFT, color: "#2f855a" }}
        >
          <TrendingUp strokeWidth={2.5} className="size-[9px]" aria-hidden />
          +80%
        </span>
      </div>
    </KitSheet>
  )
}

export function KitTrend() {
  const line = "M0 66 C 14 62, 22 52, 34 54 S 52 63, 64 52 S 84 30, 98 34 S 118 44, 132 30 S 152 16, 170 14"
  return (
    <>
      <KitGrid />
      <svg viewBox="0 0 190 104" className="kit-fade-r absolute inset-0 h-full w-full" preserveAspectRatio="none" aria-hidden>
        <defs>
          <linearGradient id="kit-trend" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0" stopColor={KIT_GREEN} stopOpacity="0.22" />
            <stop offset="1" stopColor={KIT_GREEN} stopOpacity="0" />
          </linearGradient>
        </defs>
        <g transform="translate(12 10)">
          <path d={`${line} L170 94 L0 94 Z`} fill="url(#kit-trend)" />
          <path d={line} fill="none" stroke={KIT_GREEN} strokeWidth="1.75" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
        </g>
      </svg>
      {/* The latest reading: a dot with a soft halo, drawn outside the
          stretched chart so it stays round. */}
      <span
        aria-hidden
        className="absolute size-[7px] rounded-full border-[1.5px] bg-white"
        style={{ left: "calc((182 / 190) * 100% - 3.5px)", top: "calc((24 / 104) * 100% - 3.5px)", borderColor: KIT_GREEN, boxShadow: "0 0 0 4px rgba(63,174,122,0.16)" }}
      />
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
      <KitGrid />
      <div className="absolute inset-x-4 top-4 bottom-2.5 flex items-end gap-2.5">
        {bars.map((b, i) => (
          <div key={b.k} className="flex flex-1 flex-col items-center gap-1.5">
            <span
              className="w-full rounded-t-[4px]"
              style={{
                height: `${b.v * 58}px`,
                background: i === 0 ? `linear-gradient(${KIT_GREEN}, #6cc79c)` : "linear-gradient(#d9dcdf, #e8eaec)",
              }}
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
    <KitSheet fit>
      <div className="text-[10.5px]">
        <div className="flex justify-between px-3 pt-2 pb-1.5 text-[9.5px] font-medium" style={{ color: KIT_SUBTLE }}>
          <span>Segment</span>
          <span>ARR</span>
        </div>
        {rows.map(([a, b]) => (
          <div key={a} className="flex justify-between border-t px-3 py-[7px]" style={{ borderColor: KIT_RULE }}>
            <span>{a}</span>
            <span className="font-medium tabular-nums">{b}</span>
          </div>
        ))}
      </div>
    </KitSheet>
  )
}

/** ReportUI's green "Win" callout, drawn at the kit's size: the soft green
    card, a circled check beside the bold title, the finding beneath. */
export function KitCallout() {
  return (
    <div className="kit-fade-b absolute top-3 right-3 left-3">
      <div
        className="rounded-[10px] border px-3 py-2.5 shadow-[0_1px_2px_rgba(15,15,15,0.03),0_8px_20px_-12px_rgba(0,110,45,0.18)]"
        style={{ background: "rgb(237,252,242)", borderColor: "rgb(212,241,222)", color: "rgb(0,110,45)" }}
      >
        <div className="flex items-center gap-1.5 text-[12px] font-semibold tracking-[-0.2px]">
          <svg viewBox="0 0 24 24" className="size-[13px] shrink-0" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <circle cx="12" cy="12" r="9.25" />
            <path d="m8.25 12.25 2.5 2.5 5-5.25" />
          </svg>
          Win
        </div>
        <p className="mt-1 text-[10.5px] leading-[1.45]">Net new ARR up 80% across the year, led by enterprise.</p>
      </div>
    </div>
  )
}

/** The kit: the components a report is built from. */
function ComponentKit() {
  const icon = "size-[12px]"
  return (
    <div className="grid w-full max-w-[40rem] grid-cols-1 gap-3 sm:grid-cols-3">
      <KitTile name="Report header" icon={<FileText strokeWidth={2} className={icon} />}>
        <KitHeader />
      </KitTile>
      <KitTile name="Trend chart" icon={<ChartSpline strokeWidth={2} className={icon} />}>
        <KitTrend />
      </KitTile>
      <KitTile name="KPI card" icon={<Gauge strokeWidth={2} className={icon} />}>
        <KitKpi />
      </KitTile>
      <KitTile name="Bar chart" icon={<ChartColumn strokeWidth={2} className={icon} />}>
        <KitBars />
      </KitTile>
      <KitTile name="Table" icon={<Table2 strokeWidth={2} className={icon} />}>
        <KitTable />
      </KitTile>
      <KitTile name="Callout" icon={<Lightbulb strokeWidth={2} className={icon} />}>
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
const TEMPLATES: { title: string; blurb: string; icon: React.ReactNode; sheet: React.ReactNode }[] = [
  {
    title: "ICP & TAM Discovery",
    blurb: "Validates your Ideal Customer Profile against real deal outcomes and sizes the market it points to.",
    icon: <Target strokeWidth={2} className="size-[14px]" />,
    sheet: <SheetShare />,
  },
  {
    title: "Weekly Pipeline Review",
    blurb: "New pipeline, win rate and slipped deals each week, so the team sees what moved and why.",
    icon: <CalendarClock strokeWidth={2} className="size-[14px]" />,
    sheet: <SheetSummary />,
  },
  {
    title: "Monthly Revenue Health",
    blurb: "ARR, retention and payback month by month, with the drivers behind each change.",
    icon: <Activity strokeWidth={2} className="size-[14px]" />,
    sheet: <SheetProgress />,
  },
]

function TemplateCard({ title, blurb, icon, sheet }: (typeof TEMPLATES)[number]) {
  return (
    // A white card: an icon tile beside the name and what it makes, over a
    // soft inset panel. The report rises out of the panel at a slight tilt
    // and fades away towards its foot. On hover it straightens a little.
    <div
      className="group relative h-[300px] min-w-0 flex-1 overflow-hidden rounded-[16px] border bg-white p-2.5 shadow-[0_1px_2px_rgba(15,15,15,0.03)]"
      style={{ borderColor: "#ececea" }}
    >
      <div className="flex gap-3 px-2 pt-2">
        <span
          className="flex size-[30px] shrink-0 items-center justify-center rounded-[8px] border bg-white shadow-[0_1px_2px_rgba(15,15,15,0.04)]"
          style={{ borderColor: "#ececea", color: TPL_GREEN }}
          aria-hidden
        >
          {icon}
        </span>
        <div className="min-w-0">
          <div className="text-[13.5px] font-semibold tracking-[-0.1px]">{title}</div>
          <p className="mt-1 line-clamp-2 text-[11.5px] leading-[1.5]" style={{ color: "#6b7280" }}>
            {blurb}
          </p>
        </div>
      </div>
      <div
        className="absolute inset-x-2.5 top-[96px] bottom-2.5 overflow-hidden rounded-[12px] border"
        style={{ background: "#f7f7f6", borderColor: "#f0f0ee" }}
      >
        <div className="kit-fade-b absolute inset-0">
          <div
            className="tpl-sheet absolute top-[22px] right-[30px] left-[34px] rounded-[11px] border bg-white px-4 pt-4 pb-14 shadow-[0_1px_2px_rgba(15,15,15,0.04),0_12px_28px_-14px_rgba(15,15,15,0.18)]"
            style={{ borderColor: TPL_EDGE }}
          >
            <div className="text-[12.5px] leading-tight font-semibold tracking-[-0.15px]">{title}</div>
            <Skel w="60%" className="mt-2" />
            {sheet}
          </div>
        </div>
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
  { date: "2026-10-05", week: "40", summary: "New pipeline is up 12% on last week, led by inbound. Win rate held steady, though deals are taking a few days longer to close.", kpis: ["$412K", "31%", "38d"], deltas: ["+12%", "+2pp", "+4d"], trend: [0.2, 0.35, 0.3, 0.5, 0.45, 0.62, 0.7] },
  { date: "2026-10-12", week: "41", summary: "A quieter week: new pipeline dipped 5% and two late-stage deals slipped to next quarter. Cycle time crept up again.", kpis: ["$390K", "30%", "41d"], deltas: ["−5%", "−1pp", "+3d"], trend: [0.35, 0.3, 0.5, 0.45, 0.62, 0.7, 0.58] },
  { date: "2026-10-19", week: "42", summary: "The strongest week this quarter. New pipeline jumped 20%, win rate rose to 33%, and deals are closing five days faster.", kpis: ["$468K", "33%", "36d"], deltas: ["+20%", "+3pp", "−5d"], trend: [0.3, 0.5, 0.45, 0.62, 0.7, 0.58, 0.8] },
]

/**
 * A run's trend, drawn the way the hero's win-rate chart is: a white card
 * with a legend, a y axis, dashed guides, a smooth green line over a soft
 * fill, and a dot on the latest week. Drawn at a fixed size (the page is
 * scaled as one), so the curve never stretches.
 */
function RunTrend({ values }: { values: number[] }) {
  const id = useId()
  const W = 400
  const H = 104
  const pts = values.map((v, i) => [(i / (values.length - 1)) * W, H - 6 - v * (H - 16)] as [number, number])
  const line = smoothLine(pts)
  const last = pts[pts.length - 1]!
  return (
    <div className="mt-[12px] rounded-[10px] border bg-white px-[16px] pt-[14px] pb-[12px]" style={{ borderColor: "#e8e8e6" }}>
      <div className="flex items-center gap-[6px] text-[12px]" style={{ color: "#4b5160" }}>
        <span className="size-[7px] rounded-full bg-[#3fae7a]" />
        Pipeline created
      </div>
      <div className="mt-[12px] flex">
        <div className="flex w-[40px] flex-col justify-between pb-[22px] text-[10px]" style={{ color: "#a3a7b0" }}>
          <span>$500K</span>
          <span>$250K</span>
          <span>$0</span>
        </div>
        <div className="min-w-0 flex-1">
          <svg viewBox={`0 0 ${W} ${H}`} className="block h-auto w-full overflow-visible" aria-hidden>
            <defs>
              <linearGradient id={id} x1="0" x2="0" y1="0" y2="1">
                <stop offset="0" stopColor="#3fae7a" stopOpacity="0.16" />
                <stop offset="1" stopColor="#3fae7a" stopOpacity="0" />
              </linearGradient>
            </defs>
            {[4, H / 2, H - 4].map((y) => (
              <line key={y} x1="0" x2={W} y1={y} y2={y} stroke="#ececea" strokeDasharray="4 4" />
            ))}
            <path d={`${line} L ${W} ${H} L 0 ${H} Z`} fill={`url(#${id})`} />
            <path d={line} fill="none" stroke="#3fae7a" strokeWidth="1.6" strokeLinecap="round" />
            <circle cx={last[0]} cy={last[1]} r="3.4" fill="#fff" stroke="#3fae7a" strokeWidth="1.6" />
          </svg>
          <div className="mt-[8px] flex justify-between text-[10px]" style={{ color: "#a3a7b0" }}>
            {["W36", "W37", "W38", "W39", "W40", "W41", "W42"].map((w) => (
              <span key={w}>{w}</span>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function RecurringRuns() {
  const [i, setI] = useState(0)
  const run = RUNS[i]!
  const kpis = [
    { label: "New pipeline", note: "This week" },
    { label: "Win rate", note: "Rolling 90d" },
    { label: "Cycle time", note: "Median days" },
  ]
  return (
    <div className="flex w-full max-w-[30rem] flex-col gap-4">
      {/* The runs, one plain tab per week, the chosen one on a soft grey pill. */}
      <div className="flex gap-1">
        {RUNS.map((r, j) => (
          <button
            key={r.date}
            type="button"
            onClick={() => setI(j)}
            className={`rounded-[8px] px-2.5 py-1 text-[13px] whitespace-nowrap tabular-nums transition-colors ${
              j === i ? "bg-[#e6e6e3] font-medium text-[#0f0f0f]" : "text-[#7a7a77] hover:text-[#0f0f0f]"
            }`}
          >
            Week {r.week}
          </button>
        ))}
      </div>
      {/* The report, in the hero's style, drawn at a fixed size and scaled
          to the panel. The shape stays put; only the run's numbers change.
          Its foot fades away, the way the hero's report runs off its panel. */}
      <div className="kit-fade-b max-h-[33rem] overflow-hidden">
      <Scaled width={520}>
        <div
          className={`rounded-[14px] border bg-[#fbfbfa] px-[30px] pt-[26px] pb-[28px] shadow-[0_1px_2px_rgba(15,15,15,0.04),0_18px_40px_-16px_rgba(15,15,15,0.16)] ${FONT}`}
          style={{ borderColor: LINE, color: INK }}
        >
          <div className="text-[11.5px]" style={{ color: "#4b5160" }}>
            Vasco
          </div>
          <div className="mt-[8px] text-[24px] leading-none font-semibold tracking-[-0.3px]">Weekly Pipeline Review</div>
          {/* Keyed by run, so each run's figures fade in over the same layout. */}
          <div key={run.date} className="view-in">
            {/* The hero's divided meta row, with more room between items:
                these values are short, so they'd otherwise huddle together. */}
            <div className="mt-[16px] flex">
              {[
                ["Week", run.week],
                ["Owner", "Sales"],
                ["Run", run.date],
              ].map(([k, v], j) => (
                <div key={k} className={j ? "border-l px-[22px]" : "pr-[22px]"} style={{ borderColor: "#e2e2e0" }}>
                  <div className="text-[11.5px]" style={{ color: "#4b5160" }}>{k}</div>
                  <div className="mt-[4px] text-[12.5px] font-semibold">{v}</div>
                </div>
              ))}
            </div>
            <p className="mt-[16px] text-[13.5px] leading-[1.5]" style={{ color: "#3b4150" }}>
              {run.summary}
            </p>
            <div className="mt-[20px] text-[15px] font-semibold">Scorecard</div>
            <div className="mt-[10px] flex gap-[10px]">
              {kpis.map((k, j) => {
                const delta = run.deltas[j]!
                const falling = delta.startsWith("−")
                // A shorter cycle is good news, so its arrow points the other way.
                const bad = j === 2 ? !falling : falling
                return <Kpi key={k.label} at={0} label={k.label} value={run.kpis[j]!} note={k.note} change={delta} down={bad} />
              })}
            </div>
            <div className="mt-[22px] text-[15px] font-semibold">Pipeline created, by week</div>
            <RunTrend values={run.trend} />
          </div>
        </div>
      </Scaled>
      </div>
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
/** One report in the week's pile: the same shape, the same wall of text. */
function FatigueCard({ r, i, showDate = false }: { r: (typeof INBOX)[number]; i: number; showDate?: boolean }) {
  const line = "h-[4px] rounded-full bg-[#ebebe9]"
  return (
    <Sheet className="p-3.5">
      {/* The note points at the second card, which is in the top row
          at every width. Dates give way when the cards are narrow. */}
      <div className="flex items-baseline justify-between gap-2">
        <span data-fatigue-target={i === 1 ? "" : undefined} className="min-w-0 text-[11px] leading-tight font-semibold">
          {r.title}
        </span>
        <span className={`shrink-0 text-[9px] tabular-nums ${showDate ? "inline" : "hidden sm:inline"}`} style={{ color: MUTED }}>
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
  )
}

/** A week's reports side by side: the same shape, the same wall of text.
    On a phone they pile up as a stack instead of a long grid: only each
    report's title peeks out above the next, which makes the same point. */
function ReportFatigue() {
  /* When the panel is narrow the note spans nearly its width, so any arrow
     would cross it: there the note stands alone, centred. */
  const ref = useRef<HTMLDivElement>(null)
  const [wide, setWide] = useState(true)
  const grid = useMinWidth(640)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const ro = new ResizeObserver(() => setWide(el.clientWidth >= 460))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])
  const PEEK = 26
  const back = INBOX.length - 1
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
      {grid ? (
        <div className="grid grid-cols-3 gap-3">
          {INBOX.map((r, i) => (
            <FatigueCard key={i} r={r} i={i} />
          ))}
        </div>
      ) : (
        <div className="relative" style={{ paddingTop: back * PEEK }}>
          {/* The earlier reports sit behind, each a little narrower and
              higher, so only their titles show; the latest is in front. */}
          {INBOX.slice(0, back).map((r, i) => (
            <div
              key={i}
              className="absolute"
              style={{ top: i * PEEK, left: (back - i) * 7, right: (back - i) * 7, zIndex: i }}
            >
              <FatigueCard r={r} i={i} showDate />
            </div>
          ))}
          <div className="relative" style={{ zIndex: back }}>
            <FatigueCard r={INBOX[back]!} i={back} showDate />
          </div>
        </div>
      )}
    </div>
  )
}

/* ---------- Outcome: the hero, building ---------- */

/** The hero's report, which starts building once it's scrolled into view
    rather than playing unseen when the page loads. */
/*
 * The outcome, as a little demo of how it works: a prompt box where a request
 * for a report is typed out; the send button is pressed; the box gives way to
 * the report it asked for, which fills in a piece at a time, from shimmering
 * placeholders to finished numbers and a chart drawing in. It holds, then
 * starts again. It only runs while it is on screen.
 */
const PROMPT =
  "Analyse our ICP across FY2026: revenue health, how win rate is trending, and where we're bottlenecked."
const TYPE_AT = 500
const CHAR_MS = 26
const TYPED_AT = TYPE_AT + PROMPT.length * CHAR_MS
const SEND_AT = TYPED_AT + 350
const SWAP_AT = SEND_AT + 450
// The report waits until the prompt box has fully faded (450ms) before it
// comes in, so the two never overlap.
const REPORT_AT = SWAP_AT + 550
const R = REPORT_AT + 200 // the report starts building
const BUILD = { title: R, meta: R + 450, summary: R + 800, kpi: [R + 1150, R + 1400, R + 1650], chart: R + 2000, line: R + 2400 }
const LOOP_MS = R + 6200

/** A part of the building report: a shimmering placeholder of its size
    until its turn, then the real thing fading up in its place. */
function Reveal({ on, skel, className = "", children }: { on: boolean; skel: boolean; className?: string; children: React.ReactNode }) {
  return (
    <div className={`relative ${className}`}>
      {on ? (
        <div className="view-in">{children}</div>
      ) : (
        <div className="absolute inset-0 overflow-hidden rounded-[10px]">
          <span className={`rb-skel ${skel ? "rb-on" : ""}`} />
        </div>
      )}
    </div>
  )
}

function PromptToReport() {
  const ref = useRef<HTMLDivElement>(null)
  const [t, setT] = useState(0)
  const [reduced] = useState(() => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches)

  useEffect(() => {
    const el = ref.current
    if (!el || reduced) return
    let timer: number | undefined
    let start = 0
    const run = () => {
      start = performance.now() - 0
      timer = window.setInterval(() => {
        setT((performance.now() - start) % LOOP_MS)
      }, 40)
    }
    const io = new IntersectionObserver(
      ([e]) => {
        window.clearInterval(timer)
        timer = undefined
        if (e?.isIntersecting) run()
        else setT(0)
      },
      { threshold: 0.35 },
    )
    io.observe(el)
    return () => {
      io.disconnect()
      window.clearInterval(timer)
    }
  }, [reduced])

  // With reduced motion, show the finished report and nothing moving.
  const now = reduced ? LOOP_MS - 1 : t
  const typed = PROMPT.slice(0, Math.max(0, Math.floor((now - TYPE_AT) / CHAR_MS)))
  const pressed = now >= SEND_AT && now < SEND_AT + 220
  const promptGone = now >= SWAP_AT
  const leaving = now >= LOOP_MS - 450
  const reportIn = now >= REPORT_AT
  const at = (ms: number) => now >= ms

  return (
    <div ref={ref} className={`relative flex aspect-[5/6] w-full items-center justify-center overflow-hidden px-5 sm:aspect-[16/10] sm:px-6 ${FONT}`} style={{ color: INK }}>
      {/* The prompt box. */}
      <div
        className="absolute inset-x-5 mx-auto max-w-[27rem] transition-[opacity,translate,scale] sm:inset-x-6 duration-[450ms] ease-[cubic-bezier(0.4,0,0.2,1)]"
        style={{
          opacity: promptGone ? 0 : 1,
          translate: promptGone ? "0 -10px" : "0 0",
          scale: promptGone ? "0.97" : "1",
        }}
        aria-hidden={promptGone}
      >
        <div
          className="rounded-[18px] border bg-white p-3.5 shadow-[0_1px_2px_rgba(15,15,15,0.04),0_14px_34px_-18px_rgba(15,15,15,0.18)]"
          style={{ borderColor: "#e9e9e6" }}
        >
          <p className="min-h-[3.4em] text-[13.5px] leading-[1.55]" style={{ color: typed ? INK : "#a3a3a0" }}>
            {typed || "Describe the report you want…"}
            {!promptGone && <span className="prompt-caret ml-px inline-block h-[1.05em] w-[1.5px] translate-y-[2px] bg-[#1d1d1b]" />}
          </p>
          <div className="mt-2 flex items-center justify-end">
            <span
              className="flex size-8 items-center justify-center rounded-full text-white transition-[scale,background-color] duration-150"
              style={{
                background: typed.length === PROMPT.length ? "#1d1d1b" : "#c9c9c6",
                scale: pressed ? "0.86" : "1",
              }}
              aria-hidden
            >
              <svg viewBox="0 0 16 16" className="size-[14px]" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
                <path d="M8 13V3M3.75 7.25 8 3l4.25 4.25" />
              </svg>
            </span>
          </div>
        </div>
      </div>

      {/* The report it asked for, in the hero's style: drawn at a fixed size
          and scaled to the panel, rising from the foot and fading away there,
          and filling in a piece at a time. */}
      <div
        className="kit-fade-b absolute inset-x-0 top-[6%] bottom-[8%] transition-[opacity,translate] sm:bottom-0 duration-[450ms] ease-[cubic-bezier(0.4,0,0.2,1)]"
        style={{
          opacity: reportIn && !leaving ? 1 : 0,
          translate: reportIn && !leaving ? "0 0" : "0 12px",
        }}
        aria-hidden={!reportIn}
      >
        {/* Wider on a phone, so the finished report runs past the fade at the foot. */}
        <div className="mx-auto w-[88%] max-w-[23.5rem] sm:w-[78%]">
          <Scaled width={560}>
            <div
              className="rounded-[14px] border bg-[#fbfbfa] px-[36px] pt-[30px] pb-[40px] shadow-[0_1px_2px_rgba(15,15,15,0.04),0_18px_40px_-16px_rgba(15,15,15,0.16)]"
              style={{ borderColor: LINE }}
            >
              <div className="text-[11.5px]" style={{ color: "#4b5160" }}>
                Vasco
              </div>
              <div className="mt-[8px] h-[28px] text-[26px] leading-none font-semibold tracking-[-0.3px]">
                {"ICP Analysis".slice(0, at(BUILD.title) ? Math.floor((now - BUILD.title) / 32) : 0)}
                {at(BUILD.title) && now - BUILD.title < 32 * 12 && (
                  <span className="prompt-caret ml-px inline-block h-[0.9em] w-[2px] bg-[#1d1d1b]" />
                )}
              </div>
              <Reveal on={at(BUILD.meta)} skel={at(BUILD.title)} className="mt-[16px] h-[40px]">
                <div className="flex">
                  <Meta first label="Period" value="Q4 FY 2026" />
                  <Meta label="Overall score" value="6.4/10" />
                  <Meta label="Bottleneck" value="Demand Generation" />
                </div>
              </Reveal>
              <Reveal on={at(BUILD.summary)} skel={at(BUILD.meta)} className="mt-[16px] h-[40px]">
                <p className="text-[13.5px] leading-[1.45]" style={{ color: "#3b4150" }}>
                  Trailing trend across Q1–Q4 FY2026, reconciled against the Metric Engine, with the trade-offs
                  for FY27 planning.
                </p>
              </Reveal>
              {/* Each section's title arrives with its first piece. */}
              <div
                className="mt-[22px] text-[16px] font-semibold transition-opacity duration-300"
                style={{ opacity: at(BUILD.kpi[0]!) ? 1 : 0 }}
              >
                Revenue Health Scorecard
              </div>
              <div className="mt-[10px] flex gap-[10px]">
                {[
                  ["Starting ARR", "$688K", "Beginning of FY", false],
                  ["Ending ARR", "$1.24M", "End of FY", true],
                  ["Net New ARR", "$512K", "Across 4 quarters", false],
                ].map(([label, value, note, down], k) => (
                  <Reveal key={label as string} on={at(BUILD.kpi[k]!)} skel={at(BUILD.summary)} className="min-h-[118px] flex-1">
                    <Kpi at={0} label={label as string} value={value as string} note={note as string} down={down as boolean} />
                  </Reveal>
                ))}
              </div>
              <div
                className="mt-[30px] text-[16px] font-semibold transition-opacity duration-300"
                style={{ opacity: at(BUILD.chart) ? 1 : 0 }}
              >
                Win-rate trend (rolling 90d)
              </div>
              <Reveal on={at(BUILD.chart)} skel={at(BUILD.kpi[2]!)} className="h-[226px]">
                <WinRateChart />
              </Reveal>
            </div>
          </Scaled>
        </div>
      </div>
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
        "Before Artifacts, our agents wrote reports freely, and it showed. Ask for the same weekly review twice and the second could come back with the chart gone, the numbers folded into a paragraph and the sections in a new order.",
        "They had no design system to draw on, either. An agent could invent any component, in any colour or style, with no guardrails, so reports often looked disconnected from the rest of the product and lacked the visual hierarchy that tells a reader what matters. For a report to recur, and to be trusted, its output had to be predictable, consistent and well designed.",
      ],
      media: {
        kind: "demo",
        caption: "Before Artifacts: one request, two Mondays, two reports.",
        tag: "Before Artifacts",
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
      title: "Templates, so no one starts from a blank page",
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
      title: "Our agents’ favourite thing to make",
      blurb: [
        "Artifacts became the output our agents produce more than any other, and one of the pillars of the product. It's how much of Vasco's value reaches the people who use it: a report on their own cadence, in the shape they set up, ready to share with their team.",
        "The kit and the templates did what they were built to do. The same report comes back the same way, run after run, so teams can rely on it and build a habit around it.",
      ],
      media: {
        kind: "demo",
        caption: "Ask for a report; get one built from the kit.",
        bleed: true,
        node: <PromptToReport />,
      },
    },
    {
      id: "learnings",
      label: "Learnings",
      title: "Too consistent for its own good",
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
