import { useEffect, useRef, useState } from "react"

/*
 * Hand-built recreations of the ReportUI components the Artifacts case study
 * shows: report header, KPI card, line and bar charts, data table, callout.
 * Drawn from scratch to match the designs (sizes, type, colour and spacing
 * measured from the component library), so the portfolio carries none of
 * Vasco's code. Icons are drawn here too. Figures are sample data.
 */

const FONT = "font-['Inter_Variable',Inter,sans-serif]"
const INK = "rgb(31,37,45)"
const MUTED = "rgba(31,37,45,0.72)"
const CARD_BORDER = "rgba(31,37,45,0.08)"
const HAIRLINE = "#ecedee"
const BORDER = "#dadde2"
const CHART = "#0371fe"
const TICK = "#1f252db8"
/** A forecast's dotted stroke: round dots with a gap, in the chart and its key alike. */
const DOTS = "0.01 4"

/* ---------- Scaling ---------- */

/**
 * Lays its child out at a fixed design width and scales it to fit the space
 * it's given, keeping the height in step: a component shown smaller, exactly
 * as it's designed rather than reflowed.
 */
export function Scaled({ width, children }: { width: number; children: React.ReactNode }) {
  const boxRef = useRef<HTMLDivElement>(null)
  const innerRef = useRef<HTMLDivElement>(null)
  const [fit, setFit] = useState({ scale: 0.4, h: 0 })
  useEffect(() => {
    const box = boxRef.current
    const inner = innerRef.current
    if (!box || !inner) return
    const run = () => {
      const scale = box.clientWidth / width
      setFit({ scale, h: inner.offsetHeight * scale })
    }
    run()
    const ro = new ResizeObserver(run)
    ro.observe(box)
    ro.observe(inner)
    return () => ro.disconnect()
  }, [width])
  return (
    <div ref={boxRef} className="relative w-full overflow-hidden" style={{ height: fit.h }}>
      <div
        ref={innerRef}
        className="absolute top-0 left-0"
        style={{ width, transform: `scale(${fit.scale})`, transformOrigin: "top left" }}
      >
        {children}
      </div>
    </div>
  )
}

/* ---------- Report header ---------- */

export function ReportHeader({ title, meta }: { title: string; meta: { label: string; value: string }[] }) {
  return (
    <header className={FONT} style={{ color: INK }}>
      <h1 className="text-[36px] leading-[44px] font-semibold tracking-[-0.5px]">{title}</h1>
      <dl className="mt-6 flex gap-3">
        {meta.map((m) => (
          <div key={m.label} className="flex flex-col gap-0.5 pr-6">
            <dt className="text-[12px] leading-4 font-medium tracking-[0.6px] uppercase" style={{ color: MUTED }}>
              {m.label}
            </dt>
            <dd className="text-[14px] leading-5 font-medium">{m.value}</dd>
          </div>
        ))}
      </dl>
    </header>
  )
}

/* ---------- KPI card ---------- */

function TrendArrow({ down }: { down?: boolean }) {
  return (
    <svg viewBox="0 0 12 10" className="h-[10px] w-[12px] shrink-0" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      {down ? <path d="M1 2.5 4.5 6l2-2L11 8.5M11 8.5H7.5M11 8.5V5" /> : <path d="M1 7.5 4.5 4l2 2L11 1.5M11 1.5H7.5M11 1.5V5" />}
    </svg>
  )
}

export function KpiCard({
  label,
  value,
  note,
  change,
  down,
}: {
  label: string
  value: string
  note: string
  change: string
  down?: boolean
}) {
  return (
    <div className={`flex flex-col rounded-[16px] border bg-white p-4 ${FONT}`} style={{ borderColor: CARD_BORDER, color: INK }}>
      <div className="text-[14px] leading-5 font-medium" style={{ color: MUTED }}>{label}</div>
      <div className="mt-2 text-[24px] leading-6 font-semibold tracking-[-0.3px] tabular-nums">{value}</div>
      <div className="mt-1.5 text-[14px] leading-5" style={{ color: MUTED }}>{note}</div>
      <div className="pt-5">
        <span
          className="inline-flex items-center gap-0.5 rounded-[32px] px-2 py-0.5 text-[12px] leading-4 font-medium tabular-nums"
          style={down ? { background: "rgb(254,236,236)", color: "rgb(185,28,28)" } : { background: "rgb(237,252,242)", color: "rgb(0,110,45)" }}
        >
          <TrendArrow down={down} />
          {change}
        </span>
      </div>
    </div>
  )
}

/* ---------- Charts ---------- */

/** A legend key: a dot by default, or a sample of the line it names. */
function Key({ label, kind = "dot" }: { label: string; kind?: "dot" | "line" | "dashed" }) {
  return (
    <li className="flex items-center gap-1.5">
      {kind === "dot" ? (
        <span aria-hidden className="size-2 shrink-0 rounded-full" style={{ background: CHART }} />
      ) : (
        // A sample of the line it names, drawn with the same stroke and, for a
        // forecast, the same dots as the chart, so the two read as one.
        <svg aria-hidden viewBox="0 0 16 4" className="h-[4px] w-[16px] shrink-0 overflow-visible">
          <path
            d="M2 2H14"
            fill="none"
            stroke={CHART}
            strokeWidth={2}
            strokeLinecap="round"
            strokeDasharray={kind === "dashed" ? DOTS : undefined}
          />
        </svg>
      )}
      {label}
    </li>
  )
}

/** The card every chart sits in: title and legend, then the plot. */
function ChartCard({
  title,
  keys,
  children,
}: {
  title?: string
  keys?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <div className={`flex flex-col gap-3 rounded-[16px] border bg-white p-4 ${FONT}`} style={{ borderColor: CARD_BORDER, color: INK }}>
      {(title || keys) && (
        <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
          {title && <h3 className="text-[18px] leading-6 font-semibold tracking-[-0.45px]">{title}</h3>}
          {keys && (
            <ul className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px]" style={{ color: MUTED }}>
              {keys}
            </ul>
          )}
        </div>
      )}
      {children}
    </div>
  )
}

/** Gridlines, the baseline and both axes' labels, on the plot's 386×220 grid. */
function Axes({ left, x, y }: { left: number; x: { label: string; at: number }[]; y: string[] }) {
  const rows = [182, 139.5, 97, 54.5, 12]
  return (
    <>
      {rows.map((r) => (
        <line key={r} x1={left} x2={346} y1={r} y2={r} stroke={HAIRLINE} />
      ))}
      <line x1={left} x2={346} y1={182} y2={182} stroke={BORDER} />
      {y.map((t, i) => (
        <text key={t} x={left - 12} y={rows[i]} dy="0.32em" textAnchor="end" fontSize={11} fill={TICK}>
          {t}
        </text>
      ))}
      {x.map((t) => (
        <text key={t.label} x={t.at} y={198} dy="0.71em" textAnchor="middle" fontSize={11} fill={TICK}>
          {t.label}
        </text>
      ))}
    </>
  )
}

function AreaFill({ id }: { id: string }) {
  return (
    <defs>
      <linearGradient id={id} x1="0" x2="0" y1="0" y2="1">
        <stop offset="0%" stopColor={CHART} stopOpacity={0.18} />
        <stop offset="100%" stopColor={CHART} stopOpacity={0} />
      </linearGradient>
    </defs>
  )
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun"]

/** A single series over six months: Monthly ARR. */
export function LineChart() {
  const line =
    "M53,65.833C72.533,62.41,92.067,58.986,111.6,55.917C131.133,52.847,150.667,50.486,170.2,47.417C189.733,44.347,209.267,41.042,228.8,37.5C248.333,33.958,267.867,30.181,287.4,26.167C306.933,22.153,326.467,17.785,346,13.417"
  return (
    <ChartCard title="Monthly ARR">
      <svg viewBox="0 0 386 220" className="block h-auto w-full" aria-hidden>
        <AreaFill id="rk-line-fill" />
        <Axes
          left={53}
          y={["$0K", "$300K", "$600K", "$900K", "$1200K"]}
          x={MONTHS.map((m, i) => ({ label: m, at: 53 + i * 58.6 }))}
        />
        <path d={`${line}L346,182L53,182Z`} fill="url(#rk-line-fill)" fillOpacity={0.6} />
        <path d={line} fill="none" stroke={CHART} strokeWidth={2} />
      </svg>
    </ChartCard>
  )
}

/** Reported ARR with a dashed forecast running on past it. */
export function ForecastChart() {
  const reported =
    "M53,94.875C77.417,90.448,101.833,86.021,126.25,81.063C150.667,76.104,175.083,70.969,199.5,65.125C223.917,59.281,248.333,52.641,272.75,46"
  return (
    <ChartCard
      title="ARR with Forecast"
      keys={
        <>
          <Key label="ARR" kind="line" />
          <Key label="Forecast" kind="dashed" />
        </>
      }
    >
      {/* Cropped to what's drawn (the plot and its last label end near 350),
          so the card's padding reads the same on every side. */}
      <svg viewBox="0 4 350 205" className="block h-auto w-full" aria-hidden>
        <AreaFill id="rk-forecast-fill" />
        <Axes
          left={53}
          y={["$0K", "$400K", "$800K", "$1200K", "$1600K"]}
          x={[
            { label: "Q1", at: 53 },
            { label: "Q2", at: 126.25 },
            { label: "Q3", at: 199.5 },
            { label: "Q4", at: 272.75 },
            { label: "Q1 '27", at: 333.125 },
          ]}
        />
        <path d={`${reported}L272.75,182L53,182Z`} fill="url(#rk-forecast-fill)" fillOpacity={0.6} />
        <path d={reported} fill="none" stroke={CHART} strokeWidth={2} />
        <path d="M272.75,46L346,27.938" fill="none" stroke={CHART} strokeWidth={2} strokeLinecap="round" strokeDasharray={DOTS} />
      </svg>
    </ChartCard>
  )
}

/** Six months as bars, with rounded tops. */
export function BarChart() {
  const values = [12, 18, 15, 24, 21, 29]
  const w = 21
  return (
    <ChartCard>
      <svg viewBox="0 0 386 220" className="block h-auto w-full" aria-hidden>
        <Axes
          left={26}
          y={["0", "8", "16", "24", "32"]}
          x={MONTHS.map((m, i) => ({ label: m, at: 52.667 + i * 53.333 }))}
        />
        {values.map((v, i) => {
          const x = 42 + i * 53.333
          const top = 182 - v * 5.3125
          return (
            <path
              key={i}
              d={`M${x},${top + 3}A3,3,0,0,1,${x + 3},${top}L${x + w - 3},${top}A3,3,0,0,1,${x + w},${top + 3}L${x + w},182L${x},182Z`}
              fill={CHART}
            />
          )
        })}
      </svg>
    </ChartCard>
  )
}

/* ---------- Data table ---------- */

export function DataTable({ columns, rows }: { columns: string[]; rows: string[][] }) {
  return (
    <div className={`overflow-hidden rounded-[16px] border bg-white ${FONT}`} style={{ borderColor: CARD_BORDER, color: INK }}>
      <table className="w-full border-collapse text-left">
        <thead style={{ background: "rgba(31,37,45,0.02)" }}>
          <tr>
            {columns.map((c) => (
              <th
                key={c}
                className="border-b px-4 py-2.5 text-[12px] leading-4 font-medium tracking-[0.48px] uppercase"
                style={{ borderColor: BORDER, color: MUTED }}
              >
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i}>
              {r.map((cell, j) => (
                <td
                  key={j}
                  className={`px-4 py-3 text-[14px] leading-5 tabular-nums ${j === 0 ? "font-medium" : ""} ${
                    i < rows.length - 1 ? "border-b" : ""
                  }`}
                  style={{ borderColor: BORDER }}
                >
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

/* ---------- Callout ---------- */

/** The callout's tones: a soft tint, its ink, and an outline icon drawn here. */
const TONES = {
  neutral: {
    bg: "rgba(31,37,45,0.04)",
    ink: INK,
    icon: (
      <>
        <circle cx="12" cy="12" r="9.25" />
        <path d="M12 11v5.5M10 16.5h4M10.5 11H12" />
        <circle cx="12" cy="7.75" r="0.6" fill="currentColor" />
      </>
    ),
  },
  success: {
    bg: "rgb(237,252,242)",
    ink: "rgb(0,110,45)",
    icon: (
      <>
        <circle cx="12" cy="12" r="9.25" />
        <path d="m8.25 12.25 2.5 2.5 5-5.25" />
      </>
    ),
  },
  caution: {
    bg: "rgb(254,249,195)",
    ink: "rgb(180,83,9)",
    icon: (
      <>
        <path d="M10.3 3.9a2 2 0 0 1 3.4 0l7.6 13.6a2 2 0 0 1-1.7 3H4.4a2 2 0 0 1-1.7-3Z" />
        <path d="M12 9.5v4.5" />
        <circle cx="12" cy="17" r="0.6" fill="currentColor" />
      </>
    ),
  },
} as const

/**
 * The callout: a 16px-round card in the tone's tint, an icon beside a bold
 * title, the text beneath. `compact` is a little smaller, to sit in the case
 * study's panel.
 */
export function Callout({
  tone,
  title,
  compact = false,
  children,
}: {
  tone: keyof typeof TONES
  title: string
  compact?: boolean
  children: React.ReactNode
}) {
  const t = TONES[tone]
  return (
    <div className={`${FONT} ${compact ? "rounded-[13px] p-[18px]" : "rounded-[16px] p-6"}`} style={{ background: t.bg, color: t.ink }}>
      <div className={`flex items-center ${compact ? "gap-2" : "gap-2.5"}`}>
        <svg
          viewBox="0 0 24 24"
          className={`shrink-0 ${compact ? "size-[19px]" : "size-6"}`}
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden
        >
          {t.icon}
        </svg>
        <span className={`font-semibold ${compact ? "text-[15px] leading-5 tracking-[-0.35px]" : "text-[18px] leading-6 tracking-[-0.45px]"}`}>
          {title}
        </span>
      </div>
      <p className={compact ? "mt-1.5 text-[13.5px] leading-5" : "mt-2 text-[16px] leading-6"}>{children}</p>
    </div>
  )
}
