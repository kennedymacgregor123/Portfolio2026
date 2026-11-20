/**
 * What fills the card's evidence slot: a breakdown list, a count preview, a
 * transcript passage, or a signal's thread of conversations.
 *
 * Everything is phrasing content (`span`, `button`, `a`) so a card can sit
 * inside a paragraph of report prose without producing invalid markup.
 */
import { useEffect, useRef, useState, type ReactNode } from "react"
import {
  ChevronDown,
  ChevronUp,
  FileText,
  Mail,
  Phone,
  Quote as QuoteGlyph,
  StickyNote,
  Video,
  type LucideIcon,
} from "lucide-react"

import type {
  BreakdownRow,
  CountedRow,
  Excerpt,
  Medium,
  SignalSighting,
  Unit,
} from "./citation"
import { formatCompact } from "./citation"
import { Logo } from "./logo"
import { BORDER, HAIRLINE, HIGHLIGHT, INK, MUTED, SUBTLE, cx } from "./tokens"

export const MEDIUM_GLYPH: Record<Medium, LucideIcon> = {
  call: Phone,
  email: Mail,
  meeting: Video,
  document: FileText,
  note: StickyNote,
}

/** A section's name, with an optional control or count opposite it. */
export function SectionHead({
  label,
  aside,
}: {
  label: string
  aside?: ReactNode
}) {
  return (
    <span className="flex items-baseline justify-between gap-3">
      <span
        className="block text-[13px] font-[550] leading-4"
        style={{ color: INK }}
      >
        {label}
      </span>
      {aside}
    </span>
  )
}

/** The underlined way into the full list. */
export function DrillLink({ children }: { children: ReactNode }) {
  return (
    <button
      type="button"
      className="shrink-0 cursor-pointer bg-transparent p-0 text-[11px] font-[450] leading-4 underline decoration-[#dadde2] underline-offset-2 transition-colors hover:decoration-current"
      style={{ color: INK, letterSpacing: "0.3px" }}
    >
      {children}
    </button>
  )
}

/** The bordered box every list on the card sits in. */
function ListFrame({ children }: { children: ReactNode }) {
  return (
    <span
      className="mt-2 block overflow-hidden rounded-[6px] border px-2.5"
      style={{ borderColor: HAIRLINE }}
    >
      {children}
    </span>
  )
}

function Row({ first, children }: { first: boolean; children: ReactNode }) {
  return (
    <span
      className="flex items-center gap-2 py-1.5 text-[13px] leading-[18px]"
      style={first ? undefined : { borderTop: `0.5px solid ${HAIRLINE}` }}
    >
      {children}
    </span>
  )
}

/** An 18px white tile holding a 16px logo. */
function LogoTile({ domain, name }: { domain?: string; name: string }) {
  return (
    <span
      className="inline-flex size-[18px] shrink-0 items-center justify-center overflow-hidden rounded-[4px] border bg-white"
      style={{ borderColor: BORDER }}
    >
      <Logo domain={domain} name={name} size={16} style={{ borderRadius: 3 }} />
    </span>
  )
}

export function BreakdownList({ rows, unit }: { rows: BreakdownRow[]; unit?: Unit }) {
  return (
    <ListFrame>
      {rows.map((row, i) => (
        <Row key={row.name} first={i === 0}>
          <LogoTile domain={row.domain} name={row.name} />
          <span className="min-w-0 flex-1 truncate" style={{ color: INK }}>
            {row.name}
          </span>
          <span className="shrink-0 tabular-nums" style={{ color: MUTED }}>
            {unit ? formatCompact(row.value, unit) : null}
          </span>
        </Row>
      ))}
    </ListFrame>
  )
}

export function CountedList({ rows }: { rows: CountedRow[] }) {
  return (
    <ListFrame>
      {rows.map((row, i) => (
        <Row key={row.name} first={i === 0}>
          {row.domain ? (
            <LogoTile domain={row.domain} name={row.name} />
          ) : (
            <span
              aria-hidden
              className="inline-flex size-[18px] shrink-0 items-center justify-center rounded-[4px]"
              style={{ background: HAIRLINE, color: MUTED }}
            >
              <QuoteGlyph size={9} strokeWidth={2.25} />
            </span>
          )}
          <span className="min-w-0 flex-1 truncate" style={{ color: INK }}>
            {row.name}
          </span>
          {row.note ? (
            <span className="shrink-0 text-[11px]" style={{ color: SUBTLE }}>
              {row.note}
            </span>
          ) : null}
        </Row>
      ))}
    </ListFrame>
  )
}

const FADE_DOWN =
  "linear-gradient(to bottom,#000 0%,rgba(0,0,0,.94) 20%,rgba(0,0,0,.78) 38%,rgba(0,0,0,.54) 55%,rgba(0,0,0,.3) 71%,rgba(0,0,0,.12) 85%,transparent 100%)"
const FADE_FOOT =
  "linear-gradient(to bottom,#000 0%,#000 76%,rgba(0,0,0,.88) 85%,rgba(0,0,0,.55) 92%,rgba(0,0,0,.24) 97%,transparent 100%)"

/**
 * A cited line, inside the turns either side of it.
 *
 * Closed: the turn before is clipped and the turn after fades out under a
 * round expand control. Open: a fixed-height scroller, centred on the cited
 * line, so the card keeps one of two sizes whatever the transcript's length.
 * The cited line stays in ink on a soft highlight; the turns around it dim.
 */
export function Passage({
  excerpt,
  open: forced,
}: {
  excerpt: Excerpt
  /** Set from outside when a parent row owns the disclosure. */
  open?: boolean
}) {
  const [ownOpen, setOwnOpen] = useState(false)
  const controlled = forced !== undefined
  const open = forced ?? ownOpen
  const [atFoot, setAtFoot] = useState(false)
  const scroller = useRef<HTMLSpanElement>(null)
  const cited = useRef<HTMLSpanElement>(null)
  const expandable = !controlled && Boolean(excerpt.before || excerpt.after)

  useEffect(() => {
    if (!open) return
    const box = scroller.current
    const line = cited.current
    if (!box || !line) return
    /* Set scrollTop directly; scrollIntoView would also move the page. */
    box.scrollTop = Math.max(
      0,
      line.offsetTop - box.clientHeight / 2 + line.offsetHeight / 2,
    )
    setAtFoot(box.scrollTop + box.clientHeight >= box.scrollHeight - 2)
  }, [open])

  const scrollerMask = open && !atFoot ? FADE_FOOT : undefined

  return (
    <span className="relative block">
      <span
        ref={scroller}
        onScroll={(e) => {
          const box = e.currentTarget
          setAtFoot(box.scrollTop + box.clientHeight >= box.scrollHeight - 2)
        }}
        className={cx(
          "relative block text-[13px] leading-[18px]",
          open && "max-h-[13rem] overflow-y-auto overscroll-contain pr-1",
        )}
        style={{ maskImage: scrollerMask, WebkitMaskImage: scrollerMask }}
      >
        {excerpt.before ? (
          <span
            // Whole lines only: two of them, ending in an ellipsis, never a sliver of
            // a third.
            className={cx("block", !open && "line-clamp-2")}
            style={{ color: SUBTLE }}
          >
            {excerpt.before}
          </span>
        ) : null}
        <span ref={cited} className={cx("block", excerpt.before && "mt-1.5")}>
          <span
            className="rounded-[3px] px-0.5 [box-decoration-break:clone] [-webkit-box-decoration-break:clone]"
            style={{ background: HIGHLIGHT, color: INK }}
          >
            {excerpt.line}
          </span>
        </span>
        {excerpt.after ? (
          <span
            className={cx("mt-1.5 block", !open && "max-h-[54px] overflow-hidden")}
            style={{
              color: SUBTLE,
              maskImage: open ? undefined : FADE_DOWN,
              WebkitMaskImage: open ? undefined : FADE_DOWN,
            }}
          >
            {excerpt.after}
          </span>
        ) : null}
      </span>
      {expandable ? (
        <span
          className={cx(
            "flex justify-center",
            open ? "mt-2" : "absolute inset-x-0 bottom-0",
          )}
        >
          <button
            type="button"
            onClick={() => setOwnOpen((v) => !v)}
            aria-expanded={open}
            aria-label={open ? "Close the transcript" : "Read the turns around this"}
            className="inline-flex size-6 cursor-pointer items-center justify-center rounded-full border bg-white shadow-[0_1px_2px_rgba(0,0,0,0.12)] transition-colors hover:bg-[#f4f5f6]"
            style={{ borderColor: BORDER, color: MUTED }}
          >
            {open ? (
              <ChevronUp size={11} strokeWidth={2.5} />
            ) : (
              <ChevronDown size={11} strokeWidth={2.5} />
            )}
          </button>
        </span>
      ) : null}
    </span>
  )
}

/** How many conversations a signal lists before it starts counting instead. */
const SIGHTINGS_SHOWN = 3

function SightingRow({ sighting, first }: { sighting: SignalSighting; first: boolean }) {
  const [open, setOpen] = useState(false)
  const Glyph = MEDIUM_GLYPH[sighting.medium]
  const Chevron = open ? ChevronUp : ChevronDown

  return (
    <span className={cx("relative flex gap-2.5", !first && "mt-3")}>
      {/* The thread line, running down behind the medium glyph. */}
      <span
        aria-hidden
        className="absolute bottom-0 left-[8px] top-[18px] w-[0.5px]"
        style={{ background: BORDER }}
      />
      <span
        className="relative z-10 mt-[1px] inline-flex size-[17px] shrink-0 items-center justify-center rounded-full"
        style={{ background: HAIRLINE, color: MUTED, boxShadow: "0 0 0 2px #fff" }}
        title={sighting.medium}
      >
        <Glyph size={9} strokeWidth={2.25} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-baseline justify-between gap-2">
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            className="group flex min-w-0 flex-1 cursor-pointer items-baseline gap-1 bg-transparent p-0 text-left"
          >
            <span className="min-w-0 truncate text-[13px] leading-[18px]" style={{ color: INK }}>
              {sighting.title}
            </span>
            <Chevron
              aria-hidden
              size={8}
              strokeWidth={2.75}
              className="shrink-0 self-center opacity-60 transition-opacity group-hover:opacity-100"
              style={{ color: SUBTLE }}
            />
          </button>
          <span className="shrink-0 text-[11px] tabular-nums" style={{ color: SUBTLE }}>
            {sighting.on}
          </span>
        </span>
        <span
          className="mt-1.5 block rounded-[6px] border px-2.5 py-2"
          style={{ borderColor: HAIRLINE }}
        >
          {open ? (
            <Passage excerpt={sighting.excerpt} open />
          ) : (
            <span
              className="line-clamp-2 block text-[12px] leading-4"
              style={{ color: MUTED }}
            >
              {sighting.excerpt.line}
            </span>
          )}
        </span>
      </span>
    </span>
  )
}

/** The conversations a signal was read out of, most recent first. */
export function SignalThread({
  sightings,
  unshown = 0,
}: {
  sightings: SignalSighting[]
  unshown?: number
}) {
  const shown = sightings.slice(0, SIGHTINGS_SHOWN)
  const total = sightings.length + unshown
  return (
    <span className="block">
      <SectionHead
        label="Activities"
        aside={
          total > shown.length ? (
            <span
              className="shrink-0 text-[11px] tabular-nums"
              style={{ color: INK, letterSpacing: "0.3px" }}
            >
              {shown.length} of {total} activities
            </span>
          ) : null
        }
      />
      <span className="mt-2 block">
        {shown.map((s, i) => (
          <SightingRow key={`${s.on}-${s.title}`} sighting={s} first={i === 0} />
        ))}
      </span>
    </span>
  )
}
