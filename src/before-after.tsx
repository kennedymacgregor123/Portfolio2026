import { useCallback, useLayoutEffect, useRef, useState } from "react"

import { CitedReport } from "./cited-report"

/**
 * The total width a span's text covers, across every line it wraps onto.
 * A mark repeats its side padding on each line it covers, so the padding of
 * every line after the first is taken back out: that space isn't text the
 * plain version has to match.
 */
function inlineWidth(el: HTMLElement) {
  const rects = [...el.getClientRects()]
  const s = getComputedStyle(el)
  const pad = parseFloat(s.paddingLeft) + parseFloat(s.paddingRight)
  const repeated =
    s.boxDecorationBreak === "clone" || s.getPropertyValue("-webkit-box-decoration-break") === "clone"
  const extraPadding = repeated ? pad * Math.max(0, rects.length - 1) : 0
  return rects.reduce((w, r) => w + r.width, 0) - extraPadding
}

/**
 * Keeps the plain version's lines breaking where the cited version's do.
 *
 * Each plain phrase is widened to its marked twin's width by spreading the
 * difference across its letters (the marks are a little wider: medium
 * weight, a logo, a glyph). The quote's circle is matched by sizing the
 * blank after the claim's full stop instead, since that extra room sits at
 * the end of the line, not across the sentence.
 */
function matchWidths(box: HTMLElement) {
  const plains = box.querySelectorAll<HTMLElement>("[data-plain-mark]")
  plains.forEach((p) => (p.style.letterSpacing = ""))
  plains.forEach((p) => {
    const twin = box.querySelector<HTMLElement>(`[data-mark="${p.dataset.plainMark}"]`)
    if (!twin) return
    const extra = inlineWidth(twin) - inlineWidth(p)
    const letters = (p.textContent ?? "").length
    if (extra > 0 && letters > 0) p.style.letterSpacing = `${extra / letters}px`
  })
  box.querySelectorAll<HTMLElement>("[data-plain-claim]").forEach((p) => {
    const twin = box.querySelector<HTMLElement>(`[data-claim="${p.dataset.plainClaim}"]`)
    const spacer = p.querySelector<HTMLElement>("[data-claim-spacer]")
    if (!twin || !spacer) return
    spacer.style.width = ""
    const end = (el: HTMLElement) => [...el.getClientRects()].at(-1)?.right ?? 0
    const diff = end(twin) - end(p)
    spacer.style.width = `${spacer.offsetWidth + diff}px`
  })
}

/** How far past the text, each side, the handle can travel. */
const OVERHANG = 20

/**
 * The shipped result as a before/after slider across the whole panel. The
 * same report sits twice, exactly on top of each other: the cited version on
 * white, and the before version on the panel's grey, clipped to the left of
 * the handle. Dragging only moves the clip, so the text never moves.
 *
 * The clipped-away part of the before layer takes no pointer events, so
 * marks to the right of the handle open their cards.
 */
export function BeforeAfter() {
  const rootRef = useRef<HTMLDivElement>(null)
  const textRef = useRef<HTMLDivElement>(null)
  const dragging = useRef(false)
  /** The handle's position, in pixels from the panel's left edge. */
  const [x, setX] = useState<number | null>(null)
  /** Where the handle can travel: just outside the text on each side. */
  const [range, setRange] = useState<[number, number]>([0, 0])
  const [width, setWidth] = useState(0)

  // Measure the text's edges, keep the layers wrapping alike, and start the
  // handle in the middle of the text.
  useLayoutEffect(() => {
    const root = rootRef.current
    const text = textRef.current
    if (!root || !text) return
    const run = () => {
      matchWidths(root)
      const r = root.getBoundingClientRect()
      const t = text.getBoundingClientRect()
      const lo = Math.max(0, t.left - r.left - OVERHANG)
      const hi = Math.min(r.width, t.right - r.left + OVERHANG)
      setRange([lo, hi])
      setWidth(r.width)
      setX((cur) => (cur === null ? (lo + hi) / 2 : Math.min(hi, Math.max(lo, cur))))
    }
    run()
    const ro = new ResizeObserver(run)
    ro.observe(root)
    document.fonts?.ready.then(run)
    const late = window.setTimeout(run, 400)
    return () => {
      ro.disconnect()
      window.clearTimeout(late)
    }
  }, [])

  const [lo, hi] = range
  const clamp = (v: number) => Math.min(hi, Math.max(lo, v))
  const moveTo = useCallback(
    (clientX: number) => {
      const root = rootRef.current
      if (!root) return
      setX(clamp(clientX - root.getBoundingClientRect().left))
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [lo, hi],
  )

  const pos = x ?? 0
  const pct = hi > lo ? Math.round(((pos - lo) / (hi - lo)) * 100) : 50
  const pad = "px-6 pt-14 pb-20 sm:px-10 sm:pt-16 sm:pb-24"

  return (
    <div ref={rootRef} className="before-after relative w-full select-none">
      {/* After: the cited report on white, in the flow, so it sets the
          panel's height. */}
      <div className={`after-layer flex justify-center ${pad}`}>
        <div ref={textRef} className="w-full max-w-[32rem]">
          {/* Cards float over the page, so opening one never stretches the
              panel or the handle. */}
          <CitedReport initiallyOpen={null} hint={false} floating />
        </div>
      </div>

      {/* Before: the same report with no marks on the panel's grey, clipped
          to the left of the handle. */}
      <div
        className={`before-layer absolute inset-0 z-10 flex justify-center ${pad}`}
        style={{ clipPath: `inset(0 ${Math.max(0, width - pos)}px 0 0)` }}
        aria-hidden
      >
        <div className="w-full max-w-[32rem]">
          <CitedReport plain hint={false} />
        </div>
      </div>

      <span className="ba-label pointer-events-none absolute bottom-8 left-6 z-20 sm:bottom-9">Before</span>
      <span className="ba-label pointer-events-none absolute right-6 bottom-8 z-20 sm:bottom-9">After</span>

      {/* The handle: a line the full height of the panel with a grip in the
          middle. Drag it, or focus it and use the arrow keys. */}
      {x !== null && (
        <div
          role="slider"
          tabIndex={0}
          aria-label="Compare the report before and after citations"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={pct}
          aria-valuetext={`${pct}% before`}
          onPointerDown={(e) => {
            dragging.current = true
            e.currentTarget.setPointerCapture(e.pointerId)
            moveTo(e.clientX)
          }}
          onPointerMove={(e) => {
            if (dragging.current) moveTo(e.clientX)
          }}
          onPointerUp={(e) => {
            dragging.current = false
            e.currentTarget.releasePointerCapture(e.pointerId)
          }}
          onKeyDown={(e) => {
            const step = ((hi - lo) / 100) * (e.shiftKey ? 10 : 4)
            if (e.key === "ArrowLeft") setX((v) => clamp((v ?? lo) - step))
            else if (e.key === "ArrowRight") setX((v) => clamp((v ?? lo) + step))
            else if (e.key === "Home") setX(lo)
            else if (e.key === "End") setX(hi)
            else return
            e.preventDefault()
          }}
          className="ba-handle absolute top-0 bottom-0 z-20 w-8 -translate-x-1/2 cursor-ew-resize touch-none"
          style={{ left: pos }}
        >
          <span className="ba-line absolute top-0 bottom-0 left-1/2 w-px -translate-x-1/2" />
          <span className="ba-grip absolute top-1/2 left-1/2 flex size-8 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full">
            <svg viewBox="0 0 16 16" className="size-3.5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M6 4 2.5 8 6 12M10 4l3.5 4L10 12" />
            </svg>
          </span>
        </div>
      )}
    </div>
  )
}
