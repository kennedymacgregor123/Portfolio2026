import { createContext, useContext, useEffect, useLayoutEffect, useRef, useState } from "react"

import { createPortal } from "react-dom"
import { Quote, User, type LucideIcon } from "lucide-react"

import type { Citation } from "./cite/citation"
import { CitationGroup } from "./cite/citation-group"
import { Logo } from "./cite/logo"
import {
  agentComputed,
  connectorNative,
  countedAccounts,
  groupedPair,
  namedAccount,
  namedChampion,
  pipelineCreated,
  quotedActivity,
  signalPain,
} from "./cite/fixtures"

/**
 * The after state: the same kind of generated report as the Problem section,
 * with every figure, name and quote marked. Each mark is a different kind of
 * citation, and selecting one opens its card as a popover just under the
 * mark, the way it opens in the product. All values are the prototype's
 * invented fixtures.
 */

type Kind = {
  /** The kind of citation, shown when the mark is hovered. */
  label: string
  citation: Citation
}

const KINDS = {
  metric: { label: "Metric", citation: pipelineCreated },
  group: { label: "Two sources", citation: groupedPair },
  computed: { label: "Agent-computed", citation: agentComputed },
  connector: { label: "Connector", citation: connectorNative },
  count: { label: "Count", citation: countedAccounts },
  account: { label: "Account", citation: namedAccount },
  person: { label: "Person", citation: namedChampion },
  quote: { label: "Quote", citation: quotedActivity },
  signal: { label: "Signal", citation: signalPain },
} satisfies Record<string, Kind>

type KindId = keyof typeof KINDS

/** The gap between a mark and the card that opens from it. */
const GAP = 8

/**
 * True when the report renders without its marks: the before state. The
 * marks keep their exact space (weight, padding, and an empty slot where a
 * logo or glyph would be), so the plain and cited versions break their lines
 * in the same places and can be laid over each other.
 */
const PlainCtx = createContext(false)

/** Props every mark shares: which citation it opens, and whether it's open. */
type MarkProps = {
  kind: KindId
  open: KindId | null
  onToggle: (k: KindId) => void
}

/** What makes a span behave as a button: click, Enter and Space toggle it. */
function pressable(kind: KindId, onToggle: (k: KindId) => void) {
  return {
    role: "button",
    tabIndex: 0,
    "data-mark": kind,
    onClick: (e: React.MouseEvent) => {
      e.stopPropagation()
      onToggle(kind)
    },
    onKeyDown: (e: React.KeyboardEvent) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault()
        e.stopPropagation()
        onToggle(kind)
      }
    },
  } as const
}

/**
 * CiteKit's mark for a figure or a name: medium-weight text over the kit's
 * dotted rule, on a ground that lights on hover. A figure takes tabular
 * digits; an account takes its own logo before the name, and a person the
 * kit's person glyph.
 *
 * An inline span rather than CiteKit's inline-block, so a long phrase wraps
 * with its sentence; the rule and ground repeat on each line it covers.
 */
function Mark({
  kind,
  open,
  onToggle,
  figure,
  logo,
  glyph,
  children,
}: MarkProps & {
  figure?: boolean
  /** An account's domain, for its logo. */
  logo?: string
  glyph?: LucideIcon
  children: React.ReactNode
}) {
  const on = kind === open
  const plain = useContext(PlainCtx)
  // A name (with a logo or glyph) never breaks across lines.
  const name = logo || glyph ? "whitespace-nowrap" : ""
  if (plain) {
    // Plain text; the before/after slider widens it to the marked version's
    // width with a touch of letter spacing, so the lines break alike.
    return (
      <span data-plain-mark={kind} className={`cite-mark-plain ${figure ? "tabular-nums" : ""} ${name}`}>
        {children}
      </span>
    )
  }
  return (
    <span
      {...pressable(kind, onToggle)}
      title={`${KINDS[kind].label} citation`}
      aria-expanded={on}
      className={`cite-mark ${figure ? "tabular-nums" : ""} ${name} ${on ? "is-on" : ""}`}
    >
      {logo ? (
        <Logo
          domain={logo}
          name={typeof children === "string" ? children : logo}
          size={14}
          className="mr-[0.3em]"
          // The same box the mark has always given a logo: a 0.86rem square
          // set a little below the baseline, so the line keeps its height.
          style={{ width: "0.86rem", height: "0.86rem", borderRadius: 3, verticalAlign: "-0.15em" }}
        />
      ) : glyph ? (
        (() => {
          const Glyph = glyph
          return (
            <Glyph
              aria-hidden
              strokeWidth={2.75}
              className="mr-[0.35em] inline-block text-[#a3a3a0]"
              style={{ height: "0.8em", width: "0.8em", verticalAlign: "-0.06em" }}
            />
          )
        })()
      ) : null}
      {children}
    </span>
  )
}

/**
 * CiteKit's claim affordance, for a quote: the sentence stays plain text and
 * a small quote mark in a circle follows it. Hovering or opening the mark
 * grounds the sentence it backs.
 */
function QuoteClaim({ kind, open, onToggle, children }: MarkProps & { children: string }) {
  const on = kind === open
  const [hot, setHot] = useState(false)
  /* The mark is held to the claim's last word, so it never wraps to the start
     of the next line on its own. */
  const cut = children.lastIndexOf(" ")
  const head = children.slice(0, cut + 1)
  const tail = children.slice(cut + 1)
  if (useContext(PlainCtx)) {
    // The circle's space is kept as a blank after the full stop, where a
    // little extra room reads as nothing at all.
    return (
      <span data-plain-claim={kind}>
        {head}
        <span className="whitespace-nowrap">
          {tail}
          <span data-claim-spacer className="invisible ml-[0.2em] inline-block w-[1em]" aria-hidden />
        </span>
      </span>
    )
  }
  return (
    <span data-claim={kind} className={`cite-claim ${on || hot ? "is-grounded" : ""}`}>
      {head}
      <span className="whitespace-nowrap">
        {tail}
        <span
          {...pressable(kind, onToggle)}
          title="Quote citation"
          aria-expanded={on}
          aria-label="Quote citation"
          onMouseEnter={() => setHot(true)}
          onMouseLeave={() => setHot(false)}
          onFocus={() => setHot(true)}
          onBlur={() => setHot(false)}
          className={`cite-quote ${on ? "is-on" : ""}`}
        >
          {/* Solid, like a printed quotation mark, rather than an outline. */}
          <Quote aria-hidden fill="currentColor" strokeWidth={1.5} style={{ height: "0.6em", width: "0.6em" }} />
        </span>
      </span>
    </span>
  )
}

export function CitedReport({
  plain = false,
  initiallyOpen = "metric",
  hint = true,
  floating = false,
}: {
  /** Render the before state: the same report with no marks. */
  plain?: boolean
  /** Which mark's card starts open, if any. */
  initiallyOpen?: KindId | null
  /** Show the "select any marked figure" line under the text. */
  hint?: boolean
  /**
   * Float the card over the page instead of inside the report: it can hang
   * past whatever holds the report, and never makes it taller.
   */
  floating?: boolean
} = {}) {
  const [open, setOpen] = useState<KindId | null>(plain ? null : initiallyOpen)
  const [place, setPlace] = useState<{ left: number; top: number; floor: number; maxW: number } | null>(null)
  const rootRef = useRef<HTMLDivElement>(null)
  const textRef = useRef<HTMLDivElement>(null)
  const cardRef = useRef<HTMLDivElement>(null)

  const toggle = (k: KindId) => setOpen((cur) => (cur === k ? null : k))

  /* Places the card under the open mark: below the mark's last line, with
     its left edge at the mark's start, kept inside the report. Also works
     out how much room the report needs below the text so a card near the
     end isn't clipped. */
  useLayoutEffect(() => {
    const root = rootRef.current
    const text = textRef.current
    if (!root || !text || !open) {
      setPlace(null)
      return
    }
    const measure = () => {
      const mark = root.querySelector<HTMLElement>(`[data-mark="${open}"]`)
      const card = cardRef.current
      if (!mark || !card) return
      const r = root.getBoundingClientRect()
      const lines = mark.getClientRects()
      // Nothing to measure while the report is hidden (an off-screen slide).
      if (!lines.length) return
      const first = lines[0]!
      const last = lines[lines.length - 1]!
      const width = card.offsetWidth
      const left = Math.max(0, Math.min(first.left - r.left, root.clientWidth - width))
      const top = last.bottom - r.top + GAP
      if (floating) {
        // Page coordinates: the card is placed on the page itself, so it
        // isn't clipped by, and doesn't resize, what holds the report.
        setPlace({ left: left + r.left + window.scrollX, top: top + r.top + window.scrollY, floor: 0, maxW: root.clientWidth })
        return
      }
      const floor = Math.max(0, top + card.offsetHeight + 8 - text.offsetHeight)
      setPlace({ left, top, floor, maxW: root.clientWidth })
    }
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(root)
    if (cardRef.current) ro.observe(cardRef.current)
    window.addEventListener("resize", measure)
    return () => {
      ro.disconnect()
      window.removeEventListener("resize", measure)
    }
  }, [open, floating])

  // Escape, or a click anywhere outside the card and the marks, closes it.
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(null)
    }
    const onDown = (e: PointerEvent) => {
      const t = e.target as Node
      if (cardRef.current?.contains(t)) return
      if ((t as HTMLElement).closest?.("[data-mark]")) return
      setOpen(null)
    }
    window.addEventListener("keydown", onKey)
    window.addEventListener("pointerdown", onDown)
    return () => {
      window.removeEventListener("keydown", onKey)
      window.removeEventListener("pointerdown", onDown)
    }
  }, [open])

  const shared = { open, onToggle: toggle }

  return (
    <PlainCtx.Provider value={plain}>
    <div
      ref={rootRef}
      className="relative w-full max-w-[32rem] text-left"
      style={{ paddingBottom: place?.floor ?? 0 }}
    >
      <div ref={textRef}>
        <p className="project-title">Q3 pipeline review: EMEA</p>
        <div className="case-text mt-3 flex flex-col gap-3 !text-[14px] !leading-[1.75]">
          <p>
            EMEA created{" "}
            <Mark kind="metric" figure {...shared}>
              $1.28M
            </Mark>{" "}
            in new pipeline over the last 90 days, and{" "}
            <Mark kind="group" {...shared}>
              most of it was confirmed on sales calls
            </Mark>
            .{" "}
            <Mark kind="computed" figure {...shared}>
              18.6%
            </Mark>{" "}
            of that pipeline came from partner sourcing, and product usage kept
            climbing, with{" "}
            <Mark kind="connector" figure {...shared}>
              8,613
            </Mark>{" "}
            weekly active accounts.
          </p>
          <p>
            The clearest risk sits with{" "}
            <Mark kind="account" logo={KINDS.account.citation.entity?.domain} {...shared}>
              Northwind Logistics
            </Mark>
            , where their CFO,{" "}
            <Mark kind="person" glyph={User} {...shared}>
              Dana Whitfield
            </Mark>
            ,{" "}
            <QuoteClaim kind="quote" {...shared}>
              told us they rebuild the pipeline number by hand every single month.
            </QuoteClaim>{" "}
            It's part of a wider pattern:{" "}
            <Mark kind="count" figure {...shared}>
              12 accounts
            </Mark>{" "}
            have an open pain, and{" "}
            <Mark kind="signal" {...shared}>
              manual reconciliation before every board pack
            </Mark>{" "}
            comes up most{" "}often.
          </p>
        </div>
        {hint && (
          <p className="project-blurb mt-5 !text-[12px] !text-[#898889]">
            Select any marked figure, name or quote to open its citation.
          </p>
        )}
      </div>

      {open &&
        (() => {
          const card = (
            <div
              ref={cardRef}
              key={open}
              role="dialog"
              aria-label={`${KINDS[open].label} citation`}
              /* Floating, it sits under the sticky header (z-20) as the page
                 scrolls, and takes the case study's card styling with it. */
              className={`cited-popover cited-card-in absolute ${floating ? "card-tidy z-[15]" : "z-30"}`}
              style={{
                left: place?.left ?? 0,
                top: place?.top ?? 0,
                // Never wider than the report: on a phone the card narrows
                // to fit rather than running off the edge.
                maxWidth: place?.maxW,
                visibility: place ? "visible" : "hidden",
              }}
            >
              <CitationGroup citation={KINDS[open].citation} audience="in-app" detail="full" />
            </div>
          )
          return floating ? createPortal(card, document.body) : card
        })()}
    </div>
    </PlainCtx.Provider>
  )
}
