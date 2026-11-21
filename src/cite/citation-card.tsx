/**
 * The citation card.
 *
 * One component for every kind of citation. The card is a fixed list of slots
 * (`SLOT_ORDER`); each kind fills some and leaves the rest empty. Turn
 * `showSlots` on to outline and name every slot, empty ones included.
 *
 * Everything renders as phrasing content (`span`, `a`, `button`) because a
 * card can open inside a `<p>` of report prose.
 */
import type { CSSProperties, ReactNode } from "react"
import {
  Calendar,
  ExternalLink,
  Filter,
  Layers,
  Network,
  ShieldCheck,
  Sparkles,
  Table,
  User,
  type LucideIcon,
} from "lucide-react"

import {
  attributionOf,
  formatExact,
  hasCard,
  type Attribution,
  type Audience,
  type Chip,
  type ChipKind,
  type Citation,
  type Detail,
  type SignalKind,
} from "./citation"
import {
  BreakdownList,
  CountedList,
  DrillLink,
  Passage,
  SectionHead,
  SignalThread,
} from "./evidence"
import { Logo } from "./logo"
import {
  BORDER,
  CARD_EDGE,
  FONT,
  GLYPH,
  HAIRLINE,
  INK,
  MUTED,
  SPACE,
  SUBTLE,
  cx,
} from "./tokens"

/** The slots, top to bottom: the pager, when present, is the card's first band. */
export const SLOT_ORDER = [
  "pager",
  "source",
  "header",
  "description",
  "chips",
  "evidence",
  "cta",
] as const

export type Slot = (typeof SLOT_ORDER)[number]

export const SLOT_HOLDS: Record<Slot, string> = {
  source: "Where it comes from: the system's mark and name, plus a shield once the citation has been checked.",
  header: "The thing being cited: the figure with its name beside it, or just the name when there is no number.",
  pager: "Which source you are looking at when several back the same claim, and arrows to move between them.",
  description: "A sentence on what it means: the measure's definition, or how Gama got there when no query exists.",
  chips: "The scope it holds under: time window, breakdown, filters, and who said it.",
  evidence: "The proof underneath: accounts counted, conversations read, or the transcript around a quote.",
  cta: "A single way onward, labelled with where it takes you.",
}

const ROWS_SHOWN = 4

const CHIP_GLYPH: Record<ChipKind, LucideIcon> = {
  timeframe: Calendar,
  dimension: Layers,
  filter: Filter,
  owner: User,
}

const SIGNAL_TITLE: Record<SignalKind, string> = {
  pain: "Pain",
  impact: "Impact",
  goal: "Goal",
  risk: "Risk",
  requirement: "Requirement",
}

const COUNTED_LABEL = {
  accounts: "Accounts",
  activities: "Activities",
  entities: "Entities",
} as const

/* ───────────────────────────── marks ───────────────────────────── */

/** A system glyph on the 13px grey tile a logo would occupy. */
function GlyphTile({ icon: Icon }: { icon: LucideIcon }) {
  return (
    <span
      className="inline-flex size-[13px] shrink-0 items-center justify-center rounded-[3px]"
      style={{ background: HAIRLINE, color: MUTED, boxShadow: "0 0 0 1px #fff" }}
    >
      <Icon size={8} strokeWidth={2.5} />
    </span>
  )
}

/** The mark drawn for whatever a citation is attributed to. */
export function AttributionMark({ attribution }: { attribution: Attribution }) {
  switch (attribution.mark) {
    case "engine":
      return <GlyphTile icon={Table} />
    case "graph":
      return <GlyphTile icon={Network} />
    case "gama":
      return (
        <span className="inline-flex shrink-0" style={{ color: MUTED }}>
          <Sparkles size={13} strokeWidth={2} />
        </span>
      )
    case "logos":
      return (
        <span className="inline-flex shrink-0 items-center">
          {attribution.sources.slice(0, 3).map((s, i, all) => (
            <span
              key={s.name}
              className="relative inline-flex overflow-hidden rounded-[3px] bg-white"
              style={{
                marginLeft: i === 0 ? 0 : -4,
                zIndex: all.length - i,
                boxShadow: "0 0 0 1px #fff",
              }}
            >
              <Logo domain={s.domain} name={s.name} size={13} style={{ borderRadius: 3 }} />
            </span>
          ))}
        </span>
      )
  }
}

/** Several marks overlapped, one per citation in a group. */
export function AttributionStack({ attributions }: { attributions: Attribution[] }) {
  return (
    <span className="inline-flex shrink-0 items-center">
      {attributions.slice(0, 3).map((a, i, all) => (
        <span
          key={`${a.key}-${i}`}
          className="relative inline-flex"
          style={{ marginLeft: i === 0 ? 0 : -4, zIndex: all.length - i }}
        >
          <AttributionMark attribution={a} />
        </span>
      ))}
    </span>
  )
}

/* ───────────────────────────── parts ───────────────────────────── */

function ChipRow({ chips }: { chips: Chip[] }) {
  return (
    <span className="flex flex-wrap gap-1">
      {chips.map((chip) => {
        const Icon = CHIP_GLYPH[chip.kind]
        return (
          <span
            key={`${chip.kind}-${chip.label}`}
            className="inline-flex max-w-full items-center gap-1.5 rounded-full border px-2 py-px text-[11px] font-[450] leading-4"
            style={{ borderColor: BORDER, color: INK, letterSpacing: "0.3px" }}
          >
            <Icon size={9} strokeWidth={2.5} className="shrink-0" style={{ color: GLYPH }} />
            <span className="truncate">{chip.label}</span>
          </span>
        )
      })}
    </span>
  )
}

function Cta({ label, href }: { label: string; href?: string }) {
  const cls =
    "inline-flex h-6 cursor-pointer items-center gap-1 rounded-[10px] px-2 text-[12px] font-medium leading-none text-white no-underline transition-colors hover:bg-[rgb(55,62,72)]"
  const style: CSSProperties = { background: INK, color: "#fff" }
  return href === undefined ? (
    <button type="button" className={cls} style={style}>
      {label}
    </button>
  ) : (
    <a href={href} className={cls} style={style}>
      {label}
      <ExternalLink size={10} strokeWidth={2.5} aria-hidden />
    </a>
  )
}

const PLAIN = "block text-[13px] font-[450] leading-4"

/* ───────────────────────────── card ───────────────────────────── */

export function CitationCard({
  citation: c,
  audience = "in-app",
  detail = "full",
  showSlots = false,
  hideCta = false,
  pager,
  className,
  style,
}: {
  citation: Citation
  audience?: Audience
  detail?: Detail
  /** Outline and name every slot, including the empty ones. */
  showSlots?: boolean
  /** Drop the call to action, for showcase placements. */
  hideCta?: boolean
  /** The group pager, supplied by `CitationGroup`. */
  pager?: ReactNode
  className?: string
  style?: CSSProperties
}) {
  if (!hasCard(c, audience)) return null

  const isPublic = audience === "public"
  const simplified = detail === "simplified"
  const attribution = attributionOf(c)
  const noFigure = c.kind === "entity" || c.kind === "quote" || c.kind === "signal"
  const cardTitle = c.kind === "signal" ? SIGNAL_TITLE[c.signal] : c.title
  const lead = c.figure

  /* What sits in the header under (or beside) the title. */
  const titleValue: ReactNode =
    c.kind === "signal" ? (
      <span className="block text-[13px] font-[450] leading-[18px]" style={{ color: MUTED }}>
        {c.claim}
      </span>
    ) : noFigure || !lead ? null : (
      <span className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
        <span
          className="text-[24px] font-[650] leading-7 tabular-nums"
          style={{ color: INK, letterSpacing: "-0.2px" }}
        >
          {formatExact(lead.live.value, lead.unit)}
        </span>
        <span className="text-[13px] font-[550] leading-4" style={{ color: INK }}>
          {c.title}
        </span>
      </span>
    )

  const contributing = (n: number) =>
    isPublic ? `${n} contributing accounts. Names need a seat.` : `${n} contributing accounts`

  const slots: Record<Slot, ReactNode> = {
    pager: pager ?? null,

    source: (
      <span
        className="flex items-center gap-1.5 text-[11px] font-[450] leading-none"
        style={{ color: MUTED, letterSpacing: "0.3px" }}
      >
        <AttributionMark attribution={attribution} />
        {/* Room above and below for descenders (the g in "Metric Engine"),
            which a one-line clip at this tight line height would cut off; the
            negative margin keeps the row its height. */}
        <span className="-my-[3px] min-w-0 truncate py-[3px]">{attribution.label}</span>
        {c.verified ? (
          <span
            className="inline-flex shrink-0 cursor-default"
            style={{ color: SUBTLE }}
            title="Verified"
            aria-label="Verified"
            role="img"
          >
            <ShieldCheck size={11} strokeWidth={2} />
          </span>
        ) : null}
      </span>
    ),

    header: (
      <span className="block">
        {noFigure ? (
          <span
            className="block text-[18px] font-semibold leading-6"
            style={{ color: INK, letterSpacing: "-0.1px" }}
          >
            {cardTitle}
          </span>
        ) : null}
        {titleValue ? (
          <span className="block" style={{ marginTop: noFigure ? SPACE.pair : 0 }}>
            {titleValue}
          </span>
        ) : null}
      </span>
    ),

    description: (() => {
      if (simplified) return null
      const text =
        c.kind === "metric" || c.kind === "count"
          ? c.definition
          : c.kind === "entity"
            ? c.entity.about
            : c.kind === "derived"
              ? c.working
              : c.kind === "connector"
                ? c.note
                : undefined
      return text ? (
        <span className={PLAIN} style={{ color: MUTED }}>
          {text}
        </span>
      ) : null
    })(),

    chips: (() => {
      /* A quote's day and speaker come from the excerpt itself, ahead of any
         other scope the citation adds. */
      const all: Chip[] =
        c.kind === "quote"
          ? [
              { kind: "timeframe", label: c.excerpt.on },
              { kind: "owner", label: c.excerpt.speaker },
              ...c.chips.filter((x) => x.kind !== "timeframe"),
            ]
          : c.chips
      return all.length > 0 ? <ChipRow chips={all} /> : null
    })(),

    evidence: (() => {
      switch (c.kind) {
        case "signal":
          return <SignalThread sightings={c.sightings} unshown={c.unshown} />
        case "quote":
          return <Passage excerpt={c.excerpt} />
        case "entity":
        case "derived":
        case "connector":
          return null
        case "count": {
          const total = lead?.live.value ?? c.rows.length
          const label = COUNTED_LABEL[c.counts]
          if (isPublic) {
            return (
              <span className="block text-[12px] leading-4" style={{ color: MUTED }}>
                {c.counts === "accounts"
                  ? contributing(total)
                  : `${total} contributing ${label.toLowerCase()}`}
              </span>
            )
          }
          return (
            <span className="block">
              <SectionHead
                label={label}
                aside={
                  c.rows.length < total ? (
                    <DrillLink>{`View all ${total} ${label.toLowerCase()}`}</DrillLink>
                  ) : null
                }
              />
              <CountedList rows={c.rows.slice(0, ROWS_SHOWN)} />
            </span>
          )
        }
        case "metric": {
          const total = c.breakdownTotal
          const rows = c.breakdown.slice(0, ROWS_SHOWN)
          if (isPublic) {
            return total > 0 ? (
              <span className="block text-[12px] leading-4" style={{ color: MUTED }}>
                {contributing(total)}
              </span>
            ) : null
          }
          if (simplified) {
            return total > 0 ? (
              <span className="block text-[12px] leading-4">
                <DrillLink>{contributing(total)}</DrillLink>
              </span>
            ) : null
          }
          if (rows.length === 0) {
            return total > 0 ? (
              <span className="block text-[12px] leading-4" style={{ color: MUTED }}>
                Not itemised for this snapshot.
              </span>
            ) : null
          }
          return (
            <span className="block">
              <SectionHead
                label="Accounts"
                aside={total > ROWS_SHOWN ? <DrillLink>{`View all ${total} accounts`}</DrillLink> : null}
              />
              <BreakdownList rows={rows} unit={lead?.unit} />
            </span>
          )
        }
      }
    })(),

    cta: (() => {
      if (hideCta) return null
      if (isPublic) return <Cta label="Open in Vasco" href={c.reportHref} />
      switch (c.kind) {
        case "metric":
          return <Cta label="Open in Studio" href={c.studioHref} />
        case "derived":
          return <Cta label="Ask Gama" />
        case "connector": {
          const src = c.sources.find((s) => s.href !== undefined)
          return src ? (
            <Cta label={`Open in ${src.name}`} href={src.href} />
          ) : (
            <Cta label="Ask Gama" />
          )
        }
        default:
          return <Cta label="Open the context graph" href={c.graphHref} />
      }
    })(),
  }

  /* The gap above each slot, in px. */
  const SLOT_GAP = 16
  const gap: Record<Slot, number> = {
    pager: 0,
    source: pager ? SPACE.band : 0,
    header: noFigure ? SPACE.tight : SPACE.band,
    description: SPACE.tight,
    chips: SPACE.band,
    evidence: c.kind === "quote" || simplified ? SPACE.band : SPACE.section,
    cta: SPACE.band,
  }

  /* With no figure under the title, the first body band is spaced by what sits
     above it: prose describing a name pairs with it, anything else takes a band. */
  const bodyOrder: Slot[] = ["description", "chips", "evidence", "cta"]
  const firstBody = bodyOrder.find((s) => slots[s] !== null)
  if (firstBody && titleValue === null) {
    gap[firstBody] = noFigure && c.kind !== "quote" ? SPACE.pair : SPACE.band
  }

  /* The pager, when present, is the card's first band, and the anatomy shows
     it there too. With the slots shown, every slot sits the same distance from
     the next: the outlines and labels need that room to read as separate. */
  const order: Slot[] = [...SLOT_ORDER]
  if (showSlots) {
    for (const s of SLOT_ORDER) gap[s] = SLOT_GAP
    gap[order[0]!] = 0
  }

  const frame = (slot: Slot, content: ReactNode) => {
    if (!showSlots) return content
    const empty = content === null
    return (
      <span className="block">
        <span
          className="mb-1.5 block text-[9px] font-semibold uppercase leading-3 tracking-[0.12em]"
          style={{ color: "rgba(31,37,45,0.5)" }}
        >
          {slot}
          {empty ? " — empty" : ""}
        </span>
        <span
          className="block rounded-[4px] border border-dashed p-1.5"
          style={{
            borderColor: "rgba(31,37,45,0.22)",
            background: empty ? "rgba(31,37,45,0.03)" : undefined,
            minHeight: empty ? 16 : undefined,
          }}
        >
          {content}
        </span>
      </span>
    )
  }

  return (
    <span
      className={cx(
        "block w-[21rem] max-w-full rounded-[8px] border bg-white p-3.5 text-left text-[13px] font-normal not-italic leading-normal tracking-normal antialiased",
        className,
      )}
      style={{
        borderColor: CARD_EDGE,
        color: INK,
        fontFamily: FONT,
        boxShadow: "0 1px 2px rgba(16,24,40,0.04), 0 8px 24px -8px rgba(16,24,40,0.14)",
        ...style,
      }}
      data-citation-kind={c.kind}
    >
      {order.map((slot) => {
        const content = slots[slot]
        if (content === null && (!showSlots || (slot === "cta" && hideCta))) return null
        return (
          <span key={slot} className="block" style={{ marginTop: gap[slot] }}>
            {frame(slot, content)}
            {slot === "pager" && content !== null ? (
              /* Full-bleed rule closing the group's chrome. */
              <span
                className="-mx-3.5 block border-t"
                style={{ marginTop: SPACE.band, borderColor: CARD_EDGE }}
              />
            ) : null}
          </span>
        )
      })}
    </span>
  )
}
