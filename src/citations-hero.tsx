import { useEffect, useLayoutEffect, useRef, useState } from "react"

import { CitationCard } from "./cite/citation-card"
import { pipelineCreated } from "./cite/fixtures"

/**
 * The card pops up only the first time the hero appears. When the carousel
 * brings it back, it arrives with the slide, already in place.
 */
let introPlayed = false

/** The cited figure, styled the way the prototype marks a number in prose. */
function Mark({
  children,
  markRef,
}: {
  children: string
  markRef: React.Ref<HTMLSpanElement>
}) {
  return (
    <span
      ref={markRef}
      className="rounded-sm bg-muted text-foreground underline decoration-dotted decoration-from-font underline-offset-[3px] [box-shadow:0_0_0_2px_var(--muted)]"
    >
      {children}
    </span>
  )
}

/** Report prose around the cited paragraph, so the text fills the frame. */
const BEFORE = [
  "EMEA closed the quarter ahead of plan, and most of the lift came from accounts that were already in motion. Win rate held steady through August while deal sizes grew, which pushed the region past its target for the second quarter running. Discounting stayed inside the guardrails on every deal over the approval threshold.",
]

const AFTER = [
  "The region's second half opened slower than the first, with July bookings soft across mid-market and two large renewals slipping into the following month. Both closed in August, and the team rebuilt coverage faster than the plan assumed. Partner-sourced deals made up a larger share than in any quarter this year, and most of them came through the two resellers onboarded in spring.",
  "Expansion carried more of the number than new logos did, so the forecast leans on renewals landing on time. Meetings booked rose for the third month in a row, and the gap between first call and proposal narrowed by almost a week. Sales cycles in the enterprise segment are still running long, mostly on security review.",
  "The risk sits in three late-stage deals that share a single procurement path, and the team has already started the reviews that held them up last year. If those land, the region enters the new year with the strongest coverage it has carried since the territory was split, and hiring for the second half can start on plan.",
]

/**
 * A report, faded on every side, with one marked number and the metric card it
 * opens, popped up slightly to the right of the mark.
 *
 * The card sits outside the faded layer so the fade never touches it, and is
 * placed from the mark's measured position so it follows the mark as the text
 * reflows. It is decorative: the slide is a link, so the card is `inert` and
 * hidden from assistive tech.
 */
export function CitationsHero() {
  const frameRef = useRef<HTMLDivElement>(null)
  const markRef = useRef<HTMLSpanElement>(null)
  const cardRef = useRef<HTMLDivElement>(null)
  const liftRef = useRef<HTMLDivElement>(null)
  const [intro] = useState(() => !introPlayed)
  useEffect(() => {
    introPlayed = true
  }, [])
  const [place, setPlace] = useState({ left: 0, top: 0, scale: 1, ready: false })

  useLayoutEffect(() => {
    const frame = frameRef.current
    const mark = markRef.current
    const card = cardRef.current
    if (!frame || !mark || !card) return
    const measure = () => {
      /* Layout positions, not on-screen boxes: the slide may be mid-turn on
         the carousel, rotated, and on-screen boxes would come out skewed. */
      let x = 0
      let y = 0
      for (let n: HTMLElement | null = mark; n && n !== frame; n = n.offsetParent as HTMLElement | null) {
        x += n.offsetLeft
        y += n.offsetTop
      }
      const f = { width: frame.offsetWidth, height: frame.offsetHeight }
      const m = { left: x, top: y, right: x + mark.offsetWidth, bottom: y + mark.offsetHeight }
      // Close to full size everywhere: narrow windows keep a readable card
      // rather than shrinking it with the frame.
      const scale = Math.min(0.8, Math.max(0.75, f.width / 1000))
      const width = card.offsetWidth * scale
      const height = card.offsetHeight * scale
      // The card rises beside the mark: its left edge just past the figure, and
      // its top a third of its height above the mark's line, so it reads as
      // popped up from the number. Where there is no room beside it, it drops
      // just under the mark's line instead, and it never leaves the frame's top.
      const fitsBeside = m.right + 6 + width <= f.width - 8
      const left = Math.max(8, Math.min(m.right + 6, f.width - width - 8))
      const top = Math.max(4, fitsBeside ? m.top - height * 0.33 : m.bottom + 6)
      setPlace({ left, top, scale, ready: true })
    }
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(frame)
    ro.observe(card)
    document.fonts?.ready.then(measure)
    return () => ro.disconnect()
  }, [])

  /* The card turns to face the pointer while it is over the slide, and levels
     out when it leaves. Written straight to CSS variables so a pointer move
     never re-renders the card. */
  useEffect(() => {
    const lift = liftRef.current
    const slide = frameRef.current?.closest<HTMLElement>(".hero-slide")
    if (!lift || !slide) return
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return
    const MAX = 5 // degrees
    const onMove = (e: PointerEvent) => {
      const r = lift.getBoundingClientRect()
      const s = slide.getBoundingClientRect()
      const dx = (e.clientX - (r.left + r.width / 2)) / (s.width / 2)
      const dy = (e.clientY - (r.top + r.height / 2)) / (s.height / 2)
      const clamp = (v: number) => Math.max(-1, Math.min(1, v))
      lift.style.setProperty("--ry", `${clamp(dx) * MAX}deg`)
      lift.style.setProperty("--rx", `${-clamp(dy) * MAX}deg`)
    }
    const onLeave = () => {
      lift.style.setProperty("--ry", "0deg")
      lift.style.setProperty("--rx", "0deg")
    }
    slide.addEventListener("pointermove", onMove)
    slide.addEventListener("pointerleave", onLeave)
    return () => {
      slide.removeEventListener("pointermove", onMove)
      slide.removeEventListener("pointerleave", onLeave)
    }
  }, [])

  const prose = "text-[9.5px] leading-[1.75] sm:text-[11px]"

  return (
    <div ref={frameRef} className="relative h-full w-full">
      {/* The text overruns the frame on every side, so the fade cuts into it
          rather than ending in empty space. */}
      <div className="fade-edges absolute inset-0 flex items-center justify-center overflow-hidden">
        {/* Inset from the frame so the first and last letters of a line fade
            rather than vanish, which read as clipped. */}
        {/* The shimmer sits on the whole block, so one diagonal band crosses
            every paragraph at once. */}
        <div className="prose-shimmer flex w-full flex-col gap-2.5 px-[7%]">
          {BEFORE.map((t) => (
            <p key={t} className={prose}>
              {t}
            </p>
          ))}
          <p className={prose}>
            Over the last 90 days the team created{" "}
            <Mark markRef={markRef}>$1.28M</Mark> in new pipeline, led by Ramp,
            Linear and Vercel, and the stage mix suggests most of it will reach
            a decision before year end. Inbound held its share of the total, and
            outbound sourced the largest single deal of the period.
          </p>
          {AFTER.map((t) => (
            <p key={t} className={prose}>
              {t}
            </p>
          ))}
        </div>
      </div>

      <div
        inert
        aria-hidden
        className="pointer-events-none absolute"
        style={{
          left: place.left,
          top: place.top,
          transform: `scale(${place.scale})`,
          transformOrigin: "top left",
          visibility: place.ready ? "visible" : "hidden",
        }}
      >
        <div ref={liftRef} className="card-lift">
          <div
            ref={cardRef}
            className={`hero-card ${intro ? "card-pop" : ""} drop-shadow-[0_18px_40px_rgba(15,23,42,0.16)]`}
          >
            <CitationCard citation={pipelineCreated} audience="in-app" detail="full" hideCta />
          </div>
        </div>
      </div>
    </div>
  )
}
