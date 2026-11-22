import { createContext, useContext, useEffect, useLayoutEffect, useRef, useState } from "react"
import { ChevronDown, ChevronRight, ArrowRightToLine, FileText, House, MessageSquare, Share, SquarePen, TrendingDown, TrendingUp, X } from "lucide-react"

/*
 * The ReportUI hero, built from the "Deploy" frame in Portfolio '26: the app
 * window (without its nav rail), the chat that made the report, and the
 * report open beside it. Laid out at the frame's own size (in its pixels) and
 * scaled as one piece to the hero, so it reads the same at every size.
 *
 * Each time the project comes round, the report builds: the chat comes in a
 * message at a time, the report's widgets appear as shimmering placeholders,
 * then resolve one by one, text writing itself out and the chart drawing in.
 */

/** The window's design size, in the Figma frame's pixels. Its corners are the
    inner panel's (14px) plus the padding between them (16px), so the two
    curves run parallel. */
const WIN_W = 1377
const WIN_H = 820
/** Where the report sheet's middle sits across the window, for narrow heroes. */

export const INK = "#2d3340"
export const MUTED = "#6b7280"
export const LINE = "#ebebe9"

/* ---------- The build ---------- */

/** When each piece arrives, in ms from the slide appearing. At 0 the window
    already holds the question and the report's placeholders, so it never
    swings in blank; the build starts as the carousel's swing (650ms) settles. */
const T = {
  // The chat.
  ask: 0,
  thought1: 600,
  reply1: 1300,
  review: 2300,
  thought2: 3100,
  recap: 3600,
  finalize: 4000,
  skip: 4600,
  thought3: 5300,
  done: 5800,
  // The report: placeholders first, then each widget in turn.
  sheet: 0,
  title: 1900,
  meta: 2400,
  summary: 2700,
  tabs: 3300,
  scorecard: 3600,
  kpi1: 3800,
  kpi2: 4000,
  kpi3: 4200,
  trend: 4500,
  chart: 4700,
  quality: 5600,
}
/** When the clock can stop: everything has arrived and finished moving. */
const END = 7400

/** The time since the build began, shared down the tree. */
const Clock = createContext(Number.POSITIVE_INFINITY)
const useT = () => useContext(Clock)

function useBuildClock() {
  const [t, setT] = useState(0)
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setT(Number.POSITIVE_INFINITY)
      return
    }
    const start = performance.now()
    const id = window.setInterval(() => {
      const e = performance.now() - start
      setT(e)
      if (e > END) window.clearInterval(id)
    }, 40)
    return () => window.clearInterval(id)
  }, [])
  return t
}

/** Fades and rises into place at `at`. */
function Appear({
  at,
  className = "",
  style,
  children,
}: {
  at: number
  className?: string
  style?: React.CSSProperties
  children: React.ReactNode
}) {
  const on = useT() >= at
  return (
    <div className={`rb-appear ${on ? "rb-on" : ""} ${className}`} style={style}>
      {children}
    </div>
  )
}

/**
 * A report widget: a shimmering placeholder of its own size from the moment
 * the sheet appears, giving way to the widget itself at `at`.
 */
function Build({
  at,
  radius = 6,
  className = "",
  children,
}: {
  at: number
  radius?: number
  className?: string
  children: React.ReactNode
}) {
  const t = useT()
  return (
    <div className={`relative ${className}`}>
      <div className={`rb-appear ${t >= at ? "rb-on" : ""}`}>{children}</div>
      <span
        className={`rb-skel ${t >= T.sheet && t < at ? "rb-on" : ""}`}
        style={{ borderRadius: radius }}
        aria-hidden
      />
    </div>
  )
}

/** Text that writes itself out from `at`, holding its full space throughout
    so nothing around it moves. */
function Typed({ text, at, cps }: { text: string; at: number; cps: number }) {
  const t = useT()
  const n = t < at ? 0 : Math.min(text.length, Math.floor(((t - at) * cps) / 1000))
  return (
    <>
      {text.slice(0, n)}
      <span className="invisible">{text.slice(n)}</span>
    </>
  )
}

/* ---------- Icons ---------- */


function Infinity_({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 12" className={className} fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M12 6c-2-3-3.5-4-5.5-4a4 4 0 0 0 0 8c2 0 3.5-1 5.5-4Zm0 0c2 3 3.5 4 5.5 4a4 4 0 0 0 0-8c-2 0-3.5 1-5.5 4Z" />
    </svg>
  )
}

/* ---------- The chat ---------- */

/** A thought bubble: a small cloud trailing two dots, drawn in Lucide's line
    style (24px grid, round caps) since Lucide has no thought bubble. */
function ThoughtBubble({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth={2.25} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M8.5 15.5a4 4 0 0 1-.9-7.9 5 5 0 0 1 9.4-1.4 4 4 0 0 1 .5 9.3Z" />
      <circle cx="6.5" cy="19" r="1.4" />
      <circle cx="3.6" cy="21.6" r="0.7" />
    </svg>
  )
}

/** The assistant thinking: its label shimmers until the reply starts. */
function Thought({ at, until }: { at: number; until: number }) {
  const t = useT()
  return (
    <Appear at={at}>
      <div className="flex items-center gap-[7px] text-[13px]" style={{ color: MUTED }}>
        <ThoughtBubble className="size-[13px]" />
        <span className={t >= at && t < until ? "rb-thinking" : ""}>Thoughts</span>
        <ChevronRight strokeWidth={2.25} aria-hidden className="size-[8px]" />
      </div>
    </Appear>
  )
}

/** A reply from the assistant, written out as it arrives. */
function Reply({ at, text, className = "" }: { at: number; text: string; className?: string }) {
  return (
    <Appear at={at} className={className}>
      <p className="text-[13.5px] leading-[1.45]">
        <Typed text={text} at={at} cps={80} />
      </p>
    </Appear>
  )
}

function Chat() {
  const p = "text-[13.5px] leading-[1.45]"
  return (
    <div className="flex w-[460px] shrink-0 flex-col border-r" style={{ borderColor: LINE, color: INK }}>
      {/* Header: home and new chat, the session's time, close and collapse. */}
      <div className="flex h-[50px] items-center justify-between px-[16px] text-[#4b5160]">
        <span className="flex items-center gap-[12px]">
          <House strokeWidth={2.25} aria-hidden className="size-[13px]" />
          <SquarePen strokeWidth={2.25} aria-hidden className="size-[13px]" />
        </span>
        <span className="flex items-center gap-[7px] text-[13.5px]" style={{ color: INK }}>
          <MessageSquare strokeWidth={2.25} aria-hidden className="size-[12px] text-[#4b5160]" />
          Today 10:59 am
          <ChevronDown strokeWidth={2.25} aria-hidden className="size-[8px] text-[#a3a7b0]" />
        </span>
        <span className="flex items-center gap-[14px]">
          <X strokeWidth={2.25} aria-hidden className="size-[13px]" />
          <ArrowRightToLine strokeWidth={2.25} aria-hidden className="size-[13px]" />
        </span>
      </div>

      <div className="flex flex-col gap-[14px] px-[12px] pt-[12px]">
        <Appear at={T.ask} className="ml-auto max-w-[344px]">
          <div className={`rounded-[8px] bg-[#ececeb] px-[10px] py-[7px] text-right ${p}`}>
            Q1: How would you like to proceed with the report?
            <br />
            A1: Please generate it for me.
            <br />
            Q2: What format do you prefer for the report?
            <br />
            A2: I would like it in PDF format.
          </div>
        </Appear>

        <Thought at={T.thought1} until={T.reply1} />
        <Reply
          at={T.reply1}
          className="-mt-[4px]"
          text="Great! Here’s a summary of your report. Would you like to customize any sections?"
        />

        <Appear at={T.review}>
          <div className="rounded-[8px] border bg-[#f5f5f4] px-[10px] pt-[9px] pb-[10px]" style={{ borderColor: LINE }}>
            <div className="flex items-center justify-between text-[12px]" style={{ color: MUTED }}>
              <span className="flex items-center gap-[6px]">
                <Infinity_ className="h-[7px] w-[13px]" />
                Review the report.
              </span>
              <ChevronRight strokeWidth={2.25} aria-hidden className="size-[8px]" />
            </div>
            <p className={`mt-[8px] ${p}`}>
              <Typed text="I’ve generated this report, are you satisfied with it?" at={T.review + 150} cps={80} />
            </p>
          </div>
        </Appear>

        <Thought at={T.thought2} until={T.recap} />
        <Reply at={T.recap} className="-mt-[4px]" text="Here’s a recap of your report decisions." />
        <Reply at={T.finalize} className="-mt-[2px]" text="Let me finalize this for you." />
        <Appear at={T.skip} className="ml-auto">
          <span className={`block rounded-[7px] bg-[#ececeb] px-[9px] py-[5px] ${p}`}>Skip this step.</span>
        </Appear>

        <Thought at={T.thought3} until={T.done} />
        <Reply
          at={T.done}
          className="-mt-[4px]"
          text="Here is your report. Let me know if you want to make any changes before saving."
        />
      </div>
    </div>
  )
}

/* ---------- The report ---------- */

export function Kpi({
  at,
  label,
  value,
  note,
  down,
  change = "+80%",
}: {
  at: number
  label: string
  value: string
  note: string
  down?: boolean
  /** The change shown in the badge. */
  change?: string
}) {
  return (
    <Build at={at} radius={10} className="flex-1">
      <div className="rounded-[10px] border bg-white px-[15px] pt-[14px] pb-[13px]" style={{ borderColor: "#e8e8e6" }}>
        <div className="text-[12.5px]" style={{ color: "#4b5160" }}>{label}</div>
        <div className="mt-[6px] text-[21px] leading-none font-semibold tracking-[-0.2px]">
          <Typed text={value} at={at + 120} cps={28} />
        </div>
        <div className="mt-[8px] text-[12.5px]" style={{ color: MUTED }}>{note}</div>
        <span
          className="mt-[12px] inline-flex items-center gap-[5px] rounded-[5px] px-[6px] py-[2px] text-[11px] font-medium"
          style={down ? { background: "#fbe9e9", color: "#c2453d" } : { background: "#e6f4ec", color: "#2f855a" }}
        >
          {down ? <TrendingDown strokeWidth={2.25} className="size-[10px]" aria-hidden /> : <TrendingUp strokeWidth={2.25} className="size-[10px]" aria-hidden />}
          {change}
        </span>
      </div>
    </Build>
  )
}

/*
 * The win rate, as weekly readings on the chart's 124px-high scale (6 is the
 * 16% line, 118 the 0% line). The line is drawn from these at the chart's
 * real width, so it keeps its shape and an even stroke however wide the chart
 * is laid out, rather than one fixed curve stretched to fit.
 */
// A steady climb with three waves on it, long, shorter and short, out of
// step with each other, so the rises and dips vary in size and spacing while every
// curve stays round. Sampled finely so it stays smooth. (Lower sits higher.)
const REPORTED = Array.from({ length: 41 }, (_, i) => {
  const t = i / 40
  return (
    84 -
    66 * t -
    10 * Math.sin(t * Math.PI * 2 * 2.3) -
    6 * Math.sin(t * Math.PI * 2 * 5.1 + 1.2) -
    3 * Math.sin(t * Math.PI * 2 * 8.7 + 0.4)
  )
})
const FORECAST = [96, 90, 84, 78, 72, 66, 60, 54]
const CHART_H = 124

/** A smooth line through evenly spaced readings (Catmull-Rom as Béziers). */
function smoothPath(ys: number[], width: number) {
  const pts = ys.map((y, i) => [(i / (ys.length - 1)) * width, y] as const)
  let d = `M${pts[0]![0]} ${pts[0]![1]}`
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] ?? pts[i]!
    const p1 = pts[i]!
    const p2 = pts[i + 1]!
    const p3 = pts[i + 2] ?? p2
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6]
    const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6]
    d += ` C ${c1[0]} ${c1[1]}, ${c2[0]} ${c2[1]}, ${p2[0]} ${p2[1]}`
  }
  return d
}

export function WinRateChart() {
  // The lines draw in from the left once the card is in place.
  const drawn = useT() >= T.chart + 250
  // The plot's laid-out width (unaffected by any scaling around it).
  const plotRef = useRef<HTMLDivElement>(null)
  const [w, setW] = useState(432)
  useLayoutEffect(() => {
    const el = plotRef.current
    if (!el) return
    const measure = () => setW(el.offsetWidth || 432)
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])
  const reported = smoothPath(REPORTED, w)
  return (
    <Build at={T.chart} radius={10} className="mt-[14px]">
      <div className="rounded-[10px] border bg-white px-[16px] pt-[14px] pb-[12px]" style={{ borderColor: "#e8e8e6" }}>
        <div className="flex items-center gap-[16px] text-[12px]" style={{ color: "#4b5160" }}>
          <span className="flex items-center gap-[6px]">
            <span className="size-[7px] rounded-full bg-[#3fae7a]" />
            Reported
          </span>
          <span className="flex items-center gap-[6px]">
            <span className="size-[7px] rounded-full bg-[#6b7280]" />
            Forecasted
          </span>
        </div>
        <div className="relative mt-[12px] flex">
          <div className="flex w-[34px] flex-col justify-between pb-[24px] text-[10px]" style={{ color: "#a3a7b0" }}>
            <span>16%</span>
            <span>8%</span>
            <span>0%</span>
          </div>
          {/* A container, so the week labels can thin out when the chart is
              drawn narrow (the case study on a phone) and stay whole in the
              hero, which is laid out at full size and scaled. */}
          <div className="@container flex-1">
            <div ref={plotRef} className="relative h-[124px]">
              <svg viewBox={`0 0 ${w} ${CHART_H}`} className="absolute inset-0 h-full w-full" aria-hidden>
                {[6, 62, 118].map((y) => (
                  <line key={y} x1="0" x2={w} y1={y} y2={y} stroke="#ececea" strokeDasharray="4 4" />
                ))}
              </svg>
              <svg
                viewBox={`0 0 ${w} ${CHART_H}`}
                className="rb-draw absolute inset-0 h-full w-full overflow-visible"
                style={{ clipPath: drawn ? "inset(-4px -4px -4px 0)" : "inset(-4px 100% -4px 0)" }}
                aria-hidden
              >
                <defs>
                  <linearGradient id="winrate-fill" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0" stopColor="#3fae7a" stopOpacity="0.14" />
                    <stop offset="1" stopColor="#3fae7a" stopOpacity="0" />
                  </linearGradient>
                </defs>
                <path d={`${reported} L ${w} ${CHART_H} L 0 ${CHART_H} Z`} fill="url(#winrate-fill)" />
                <path d={smoothPath(FORECAST, w)} fill="none" stroke="#b8bcc4" strokeWidth="1.2" strokeDasharray="2 3" />
                <path d={reported} fill="none" stroke="#3fae7a" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <div className="mt-[8px] flex justify-between text-[10px]" style={{ color: "#a3a7b0" }}>
              {["Wk1", "Wk2", "Wk3", "Wk4", "Wk5"].map((w, i) => (
                <span key={w} className={i % 2 ? "@max-xs:invisible" : ""}>
                  {w}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </Build>
  )
}

export function Meta({ label, value, first }: { label: string; value: string; first?: boolean }) {
  return (
    <div className={first ? "pr-[12px]" : "border-l px-[12px]"} style={{ borderColor: "#e2e2e0" }}>
      <div className="text-[11.5px]" style={{ color: "#4b5160" }}>{label}</div>
      <div className="mt-[4px] text-[12.5px] font-semibold">{value}</div>
    </div>
  )
}

function Report() {
  return (
    <div className="flex min-w-0 flex-1 flex-col" style={{ color: INK }}>
      <div className="flex h-[52px] shrink-0 items-center justify-between border-b bg-white pr-[18px] pl-[18px]" style={{ borderColor: LINE }}>
        <Appear at={T.sheet}>
          <span className="flex items-center gap-[8px] text-[13.5px] font-medium">
            <FileText strokeWidth={2.25} aria-hidden className="size-[13px] text-[#4b5160]" />
            ICP Analysis
          </span>
        </Appear>
        <span className="flex size-[24px] items-center justify-center rounded-[6px] border" style={{ borderColor: "#e2e2e0" }}>
          <Share strokeWidth={2.25} aria-hidden className="size-[11px] text-[#4b5160]" />
        </span>
      </div>

      <div className="min-h-0 flex-1 bg-[#f3f3f2] px-[68px] pt-[33px]">
        <Appear at={T.sheet}>
          <div className="rounded-[10px] bg-[#fbfbfa] px-[58px] pt-[40px] pb-[40px] shadow-[0_1px_2px_rgba(15,15,15,0.04),0_10px_30px_-12px_rgba(15,15,15,0.08)]">
            <Build at={T.title} className="w-fit">
              <div className="text-[11.5px]" style={{ color: "#4b5160" }}>Vasco</div>
              <h3 className="mt-[8px] text-[28px] leading-none font-semibold tracking-[-0.3px]">
                <Typed text="ICP Analysis" at={T.title} cps={30} />
              </h3>
            </Build>
            <Build at={T.meta} className="mt-[20px] w-fit">
              <div className="flex">
                <Meta first label="Period" value="Q4 FY 2026" />
                <Meta label="Overall score" value="6.4/10" />
                <Meta label="Bottleneck" value="Demand Generation" />
              </div>
            </Build>
            <Build at={T.summary} className="mt-[20px]">
              <p className="text-[14px] leading-[1.4]" style={{ color: "#3b4150" }}>
                <Typed
                  text="Trailing trend across Q1–Q4 FY2026. Numbers reconciled against the Metric Engine; recommendations weigh the trade-offs for FY27 planning."
                  at={T.summary}
                  cps={220}
                />
              </p>
            </Build>
            <Build at={T.tabs} className="mt-[20px]">
              <div className="flex gap-[19px] border-b text-[12.5px]" style={{ borderColor: "#e8e8e6", color: "#4b5160" }}>
                <span className="-mb-px border-b-[1.5px] pb-[8px] font-medium" style={{ borderColor: INK, color: INK }}>
                  At a Glance
                </span>
                <span>Predictive traits</span>
                <span>Industry revenue</span>
                <span>Regional revenue</span>
              </div>
            </Build>

            <Build at={T.scorecard} className="mt-[28px] w-fit">
              <h4 className="text-[17px] font-semibold">
                <Typed text="Revenue Health Scorecard" at={T.scorecard} cps={70} />
              </h4>
            </Build>
            <div className="mt-[14px] flex gap-[10px]">
              <Kpi at={T.kpi1} label="Starting ARR" value="$688K" note="Beginning of FY" />
              <Kpi at={T.kpi2} label="Ending ARR" value="$1.24M" note="End of FY" down />
              <Kpi at={T.kpi3} label="Net New ARR" value="$512K" note="Across 4 quarters" />
            </div>

            <Build at={T.trend} className="mt-[24px] w-fit">
              <h4 className="text-[17px] font-semibold">
                <Typed text="Win-rate trend (rolling 90d)" at={T.trend} cps={70} />
              </h4>
            </Build>
            <WinRateChart />

            <Build at={T.quality} className="mt-[24px] w-fit">
              <h4 className="text-[17px] font-semibold">
                <Typed text="Revenue Quality" at={T.quality} cps={70} />
              </h4>
            </Build>
          </div>
        </Appear>
      </div>
    </div>
  )
}

/* ---------- The hero ---------- */

export function ReportUIHero() {
  const frameRef = useRef<HTMLDivElement>(null)
  const [fit, setFit] = useState({ scale: 0.45, left: 0, top: 0, cropped: false })
  const t = useBuildClock()

  /* The whole window sits in the frame, centred, so its padding shows evenly
     all round, at every width: on a phone too, it's shown whole rather than
     cropped, so the chat and the report are both in view. */
  useLayoutEffect(() => {
    const frame = frameRef.current
    if (!frame) return
    const run = () => {
      const w = frame.clientWidth
      const h = frame.clientHeight
      const scale = Math.min((w * 0.94) / WIN_W, (h * 0.92) / WIN_H)
      setFit({ scale, left: (w - WIN_W * scale) / 2, top: (h - WIN_H * scale) / 2, cropped: false })
    }
    run()
    const ro = new ResizeObserver(run)
    ro.observe(frame)
    return () => ro.disconnect()
  }, [])

  return (
    <Clock.Provider value={t}>
      <div ref={frameRef} className="relative h-full w-full">
        {/* The fade is measured from the window, not the frame: on a phone the
            frame is far taller than the window, and a frame-based fade would
            end below it. */}
        <div
          className={`report-window-fade absolute inset-0 overflow-hidden ${fit.cropped ? "cropped" : ""}`}
          style={
            {
              "--fade-y": `linear-gradient(to bottom, #000 ${fit.top + WIN_H * fit.scale * 0.76}px, transparent ${fit.top + WIN_H * fit.scale * 0.967}px)`,
            } as React.CSSProperties
          }
        >
          <div
            className="report-window pointer-events-none absolute flex overflow-hidden rounded-[30px] bg-[#f8f8f7] p-[16px] font-['Inter_Variable',Inter,sans-serif]"
            style={{
              width: WIN_W,
              height: WIN_H,
              left: fit.left,
              top: fit.top,
              transform: `scale(${fit.scale})`,
              transformOrigin: "top left",
            }}
          >
            <div className="flex min-w-0 flex-1 overflow-hidden rounded-[14px] border bg-[#fbfbfa]" style={{ borderColor: LINE }}>
              <Chat />
              <Report />
            </div>
          </div>
        </div>
      </div>
    </Clock.Provider>
  )
}
