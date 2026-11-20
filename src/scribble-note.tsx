import { useLayoutEffect, useRef, useState } from "react"

/**
 * A handwritten note in a pen colour, with a hand-drawn curved arrow from the
 * note to a target inside the same container. The arrow is drawn to wherever
 * the target actually sits, so it keeps pointing at it as the text rewraps.
 *
 * Put this inside a `position: relative` container, and mark the target with
 * `data-scribble-target` (or pass another selector as `target`). With
 * `target={null}` the note has no arrow.
 */
export function ScribbleNote({
  children,
  target = "[data-scribble-target]",
  approach = "above",
  arrow = true,
  stopAt,
  ring = false,
  className = "top-0 right-1 sm:-right-4",
}: {
  children: React.ReactNode
  /** Which element in the container the arrow points at; null for none. */
  target?: string | null
  /**
   * How the arrow meets the target: dropping onto it from above, or coming
   * in level from its right or its left (for a note on that side of it).
   */
  approach?: "above" | "right" | "left"
  /** Draw the arrow; false leaves just the note (and its ring, if any). */
  arrow?: boolean
  /**
   * Coming in from the right, stop at this element's right edge (level with
   * the target) instead of at the target, so the line doesn't cross what's
   * between them.
   */
  stopAt?: string
  /** Draw a quick hand-drawn ring around the target. */
  ring?: boolean
  /** Where the note sits in the container. */
  className?: string
}) {
  const noteRef = useRef<HTMLSpanElement>(null)
  const [path, setPath] = useState<{
    d: string
    head: string
    ring?: string
    w: number
    h: number
  } | null>(null)

  useLayoutEffect(() => {
    const note = noteRef.current
    const box = note?.offsetParent as HTMLElement | null
    if (!note || !box || !target) return
    const draw = () => {
      const el = box.querySelector<HTMLElement>(target)
      if (!el) return
      const b = box.getBoundingClientRect()
      const n = note.getBoundingClientRect()
      const t = el.getClientRects()[0] ?? el.getBoundingClientRect()
      const fromLeft = approach === "left"
      // From just beside the note, on the target's side, level with its
      // lower half, so the line never crosses the handwriting.
      const sx = fromLeft ? n.right - b.left + 6 : n.left - b.left - 6
      const sy = n.top - b.top + n.height * 0.65
      // The tip stops clear of the target, so it points without touching:
      // above its right end, or just off its near edge.
      const wall = stopAt ? box.querySelector<HTMLElement>(stopAt)?.getBoundingClientRect() : undefined
      const ex =
        approach === "above"
          ? t.left - b.left + t.width * 0.8
          : fromLeft
            ? t.left - b.left - (ring ? 16 : 10)
            : (wall ? wall.right : t.right) - b.left + 10
      const ey = approach === "above" ? t.top - b.top - 8 : t.top - b.top + t.height * 0.45
      // A shallow bow: out from the note, arcing up and over, then onto the
      // target, the way a quick arrow is drawn by hand. Bowing upward keeps
      // the line away from the text it points at.
      const span = sx - ex
      const c1x = sx - span * 0.35
      const c1y = sy - 14
      const c2x = ex + span * (approach === "above" ? 0.12 : 0.3)
      const c2y = ey - (approach === "above" ? 26 : 12)
      const d = `M ${sx} ${sy} C ${c1x} ${c1y}, ${c2x} ${c2y}, ${ex} ${ey}`
      // The arrowhead: two short strokes back from the tip, along the
      // curve's final direction.
      const ang = Math.atan2(ey - c2y, ex - c2x)
      const len = 6
      const a1 = ang + Math.PI - 0.5
      const a2 = ang + Math.PI + 0.45
      const head = `M ${ex + Math.cos(a1) * len} ${ey + Math.sin(a1) * len} L ${ex} ${ey} L ${ex + Math.cos(a2) * len} ${ey + Math.sin(a2) * len}`
      /* A ring drawn the way a pen circles a word: an ellipse a little
         larger than the target, slightly tilted, whose end overshoots its
         start rather than closing neatly. */
      let ringPath: string | undefined
      if (ring) {
        const cx = t.left - b.left + t.width / 2
        const cy = t.top - b.top + t.height / 2
        const rx = t.width / 2 + 9
        const ry = t.height / 2 + 6
        const pts: string[] = []
        for (let i = 0; i <= 36; i++) {
          const a = -0.6 + (i / 36) * (Math.PI * 2 + 0.5)
          const wobble = 1 + 0.05 * Math.sin(a * 3)
          const x = cx + Math.cos(a) * rx * wobble
          const y = cy + Math.sin(a) * ry * wobble - Math.cos(a) * 1.5
          pts.push(`${i ? "L" : "M"} ${x.toFixed(1)} ${y.toFixed(1)}`)
        }
        ringPath = pts.join(" ")
      }
      setPath({ d, head, ring: ringPath, w: box.clientWidth, h: box.clientHeight })
    }
    draw()
    /* Redraw whenever anything that moves the ends changes: the box's outer
       size (padding moves the text without changing its inner size), the
       note, the target, and once fonts and styles have loaded. */
    const ro = new ResizeObserver(draw)
    ro.observe(box, { box: "border-box" })
    ro.observe(note)
    const el = box.querySelector<HTMLElement>(target)
    if (el) ro.observe(el)
    document.fonts?.ready.then(draw)
    window.addEventListener("load", draw)
    const late = window.setTimeout(draw, 300)
    return () => {
      ro.disconnect()
      window.removeEventListener("load", draw)
      window.clearTimeout(late)
    }
  }, [target, approach, stopAt, ring, arrow])

  return (
    <>
      <span ref={noteRef} className={`scribble-note pointer-events-none absolute ${className}`} aria-hidden>
        {children}
      </span>
      {path && (
        <svg
          className="scribble-arrow pointer-events-none absolute top-0 left-0 overflow-visible"
          width={path.w}
          height={path.h}
          aria-hidden
        >
          {arrow && <path d={path.d} />}
          {arrow && <path d={path.head} />}
          {path.ring && <path d={path.ring} />}
        </svg>
      )}
    </>
  )
}
