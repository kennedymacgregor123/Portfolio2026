import { useEffect, useLayoutEffect, useRef, useState } from "react"
import { ArrowUpRight, Brush, CircleAlert, Eye, Globe, Handshake, LayoutTemplate, PackageCheck, RotateCcw, SlidersHorizontal, Store, TrendingUp, UserCheck } from "lucide-react"

import type { CaseStudy } from "./case-study"
import { AiLabel, Badge, BrandArt, DRAFTS, LanyardClip, PlannedBadge, PlannedLogo, SlotRim, slotMask, type Style } from "./planned-badge"
import { Scaled } from "./report-kit"
import { SkillsFigure } from "./planned-skills"

/*
 * A concept case study: AI-drafted, on-brand event badges for Planned's badge
 * builder. Its figures are built from the working prototype itself, so every
 * badge shown here is the real thing. The event and people are invented.
 */

const FONT = "font-['Inter_Variable',Inter,system-ui,sans-serif]"

/* ---------- The hero: three drafted badges, fanned ---------- */

const HERO_W = 1100
const HERO_H = 520

/**
 * A real-looking lanyard badge in Planned's brand: a woven black strap, a
 * metal D-ring and clip, and a punched card in Planned's own look: a hazy
 * evening sky under heavy grain, warming to gold behind the name. It drops in, bounces on the strap, then dangles, swinging
 * from the clip and turning a little in 3D before settling into a slow sway.
 */
/** The badge's styles, in the order it spins through them. */
const SPIN = DRAFTS

/**
 * One side of the hero badge, in one of the AI-drafted styles: Planned's mark,
 * the event set large, and the attendee at the foot of the card.
 */
function HeroFace({ style, flipped = false, hidden = false }: { style: Style; flipped?: boolean; hidden?: boolean }) {
  const head = style.headInk ?? style.ink
  return (
    <div
      className="absolute inset-0 rounded-[16px]"
      style={{
        visibility: hidden ? "hidden" : "visible",
        transform: flipped ? "rotateY(180deg)" : undefined,
        boxShadow: "0 30px 60px -24px rgba(15,25,30,0.55), 0 8px 16px -8px rgba(15,25,30,0.3)",
      }}
    >
    {/* The card itself, with a real slot cut through it. */}
    <div
      className={`absolute inset-0 overflow-hidden rounded-[16px] ${FONT}`}
      style={{
        background: style.surface,
        color: style.ink,
        boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.4)",
        fontFamily: "Geist, 'Inter Variable', Inter, sans-serif",
        ...slotMask(30, 12, 10),
      }}
    >
      {/* The cloud sits a little lower here, so it rises behind the name, not the dates. */}
      {style.art && <BrandArt art={style.art} lower={style.art === "cloud" ? 40 : 0} />}
      <div className="relative flex h-full flex-col px-[18px] pt-[38px] pb-[14px]">
        <div style={{ color: head }}>
          <PlannedLogo size={24} />
        </div>
        <div className="mt-3 text-[40px] leading-[0.94] font-medium tracking-[-0.03em]" style={{ color: head }}>
          Planned
          <br />
          Live
        </div>
        {/* When and where, set together as one quiet line each. */}
        <div className="mt-3 text-[11px] leading-[1.45] tabular-nums" style={{ color: style.headInk ? head : style.sub }}>
          <div>2026-10-06 – 2026-10-08</div>
          <div>San Francisco</div>
        </div>
        <div className="mt-auto">
          <span
            className="inline-flex rounded-full px-2 py-[2px] text-[8px] font-semibold tracking-[0.1em] uppercase"
            style={{ background: "rgba(255,255,255,0.5)", boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.65)" }}
          >
            General
          </span>
          <div className="mt-1.5 text-[22px] leading-tight font-semibold tracking-[-0.02em]">Jane Smith</div>
          <div className="mt-0.5 text-[11px]" style={{ color: style.sub }}>
            Head of Events · Northwind Financial
          </div>
        </div>
      </div>
      {/* A soft sheen that catches the light as the card turns. */}
      <span className="lanyard-sheen pointer-events-none absolute inset-0" />
    </div>
    <SlotRim w={30} h={12} top={10} />
    </div>
  )
}

/**
 * Spins the badge through each drafted style. The side facing away always
 * holds the next style, so each half turn reveals a new one.
 */
function useSpin(delay = 4200, every = 3600) {
  const [turn, setTurn] = useState(0)
  // Which side shows: it changes halfway through each half turn, when the
  // card is edge-on and neither side can be seen.
  const [face, setFace] = useState<"front" | "back">("front")
  const [shown, setShown] = useState(0)
  useEffect(() => {
    const t = window.setTimeout(() => {
      setFace(turn % 2 === 0 ? "front" : "back")
      setShown(turn)
    }, turn === 0 ? 0 : 560)
    return () => window.clearTimeout(t)
  }, [turn])
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return
    let iv: number | undefined
    const t = window.setTimeout(() => {
      setTurn((n) => n + 1)
      iv = window.setInterval(() => setTurn((n) => n + 1), every)
    }, delay)
    return () => {
      window.clearTimeout(t)
      if (iv) window.clearInterval(iv)
    }
  }, [delay, every])
  const at = (k: number) => SPIN[k % SPIN.length]!
  // The side facing out shows the current style; the hidden side the next.
  const front = at(face === "front" ? shown : shown + 1)
  const back = at(face === "back" ? shown : shown + 1)
  return { turn, front, back, face, showing: at(shown) }
}

function LanyardBadge({ turn, front, back, face }: { turn: number; front: Style; back: Style; face: "front" | "back" }) {
  return (
    <div className="lanyard-drop absolute top-0 left-1/2 flex -translate-x-1/2 flex-col items-center" style={{ perspective: 1100 }}>
      {/* The strap, folded through the D-ring at its foot. */}
      <span
        className="relative block h-[96px] w-[62px]"
        style={{
          // The strap fades in from above, as if it runs off the top of the page.
          WebkitMaskImage: "linear-gradient(to bottom, transparent, #000 70%)",
          maskImage: "linear-gradient(to bottom, transparent, #000 70%)",
          background:
            "linear-gradient(90deg, rgba(0,0,0,0.35), rgba(255,255,255,0.06) 30%, rgba(255,255,255,0.03) 70%, rgba(0,0,0,0.4)), repeating-linear-gradient(135deg, #1a1a1a 0 2.5px, #262626 2.5px 5px)",
          clipPath: "polygon(0 0, 100% 0, 100% 86%, 74% 100%, 26% 100%, 0 86%)",
        }}
      />
      {/* The swinging part: clip and card, pivoting at the D-ring. */}
      <div className="lanyard-swing -mt-[8px] flex flex-col items-center" style={{ transformOrigin: "50% 0" }}>
        <LanyardClip className="relative z-10 h-[92px] w-[60px]" cardTop={70} slot={{ x: 15, y: 80, w: 30, h: 12 }} />
        {/* The card sits high enough that the clip's loop hangs down into its hole. */}
        <div className="lanyard-turn -mt-[22px]" style={{ transformStyle: "preserve-3d" }}>
          {/* Two sides, so the card can spin on its lanyard. */}
          <div
            className="relative h-[330px] w-[232px]"
            style={{ transformStyle: "preserve-3d", transform: `rotateY(${turn * 180}deg)`, transition: "transform 1300ms cubic-bezier(0.55, 0, 0.2, 1)" }}
          >
            <HeroFace style={front} hidden={face !== "front"} />
            <HeroFace style={back} flipped hidden={face !== "back"} />
          </div>
        </div>
      </div>
    </div>
  )
}

function BadgeFan({ compact = false }: { compact?: boolean }) {
  const { turn, front, back, face, showing } = useSpin()
  return (
    <div className="relative" style={{ width: HERO_W, height: HERO_H }}>
      <LanyardBadge turn={turn} front={front} back={back} face={face} />
      {/* The brief it was drafted from, marked as AI. */}
      <div
        className={`artifact-hero-in absolute ${compact ? "top-[392px] left-[600px]" : "top-[214px] left-[690px]"} flex items-center gap-2 rounded-full border bg-white px-3.5 py-2 text-[13px] shadow-[0_1px_2px_rgba(15,15,15,0.04),0_10px_24px_-12px_rgba(15,15,15,0.18)] ${FONT}`}
        style={{ borderColor: "#ebebe9", color: "#1d1d1b", animationDelay: "1400ms" }}
      >
        <AiLabel />
        {/* One phrase, with an ordinary word space between the style and its source. */}
        <span className="whitespace-nowrap">
          <span key={showing.id} className="view-in inline-block">
            {showing.name}
          </span>{" "}
          <span className="text-[#8a8a86]">drafted before you asked</span>
        </span>
      </div>
    </div>
  )
}

/** The case study's hero: the badge on a panel, scaled to the page. */
function PlannedCaseHero() {
  return (
    <div inert aria-hidden className="case-media relative overflow-hidden">
      <Scaled width={HERO_W}>
        <BadgeFan />
      </Scaled>
    </div>
  )
}

/** The home carousel's slide: the same fan, fitted whole into the frame. */
export function PlannedHero() {
  const box = useRef<HTMLDivElement>(null)
  const [fit, setFit] = useState({ scale: 0.5, left: 0, top: 0 })
  useLayoutEffect(() => {
    const el = box.current
    if (!el) return
    const run = () => {
      const w = el.clientWidth
      const h = el.clientHeight
      // Fit to the badge, not the whole scene: the faded top of the strap
      // runs off the frame, so the badge itself can be much larger.
      const crop = 70
      if (w < 480) {
        // Phones: fit to the badge and its chip only, and centre it in the frame.
        const tall = 430
        const scale = Math.min(w / 580, h / tall) * 0.96
        setFit({ scale, left: w / 2 - 580 * scale, top: (h - tall * scale) / 2 - crop * scale })
        return
      }
      const scale = Math.min(w / 760, h / (HERO_H - crop - 40)) * 0.96
      setFit({ scale, left: w / 2 - (HERO_W / 2) * scale, top: -crop * scale })
    }
    run()
    const ro = new ResizeObserver(run)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])
  return (
    <div ref={box} className="relative h-full w-full">
      {/* No panel: the badge hangs straight on the page, its strap fading in from above. */}
      <div className="absolute" style={{ left: fit.left, top: fit.top, transform: `scale(${fit.scale})`, transformOrigin: "top left" }}>
        <BadgeFan compact />
      </div>
    </div>
  )
}

/* ---------- Figures ---------- */

/** The prototype page, drawn at its own width and scaled to the panel. */
function PageFigure({ ai, known = true }: { ai: boolean; known?: boolean }) {
  return (
    <div className="w-full overflow-hidden rounded-[12px] border border-white shadow-[0_1px_2px_rgba(15,15,15,0.04),0_18px_40px_-20px_rgba(15,15,15,0.2)]">
      <Scaled width={1240}>
        <PlannedBadge embedded ai={ai} known={known} />
      </Scaled>
    </div>
  )
}

/** What I assumed going in, and how I'd check each one. None are tested yet. */
const ASSUMPTIONS: { area: string; icon: typeof Store; tint: string; text: string; check: string }[] = [
  {
    area: "Product",
    icon: LayoutTemplate,
    tint: "linear-gradient(135deg, #d6ece9, #c2e0e1)",
    text: "The badge page doesn't use AI yet, and Planned already holds each event's website, brand and photos.",
    check: "Confirm with the team what's in flight, and what event data the badge page can reach.",
  },
  {
    area: "Business",
    icon: TrendingUp,
    tint: "linear-gradient(135deg, #f4eccf, #f3dcae)",
    text: "Badges are a moment for profitability, whether as a premium feature or as print revenue.",
    check: "Look at upgrade and print data, and how often badges come up in sales calls.",
  },
  {
    area: "Behaviour",
    icon: ArrowUpRight,
    tint: "linear-gradient(135deg, #dce8f1, #c9dceb)",
    text: "Organisers who want a more custom badge sometimes take it to an outside designer or print vendor.",
    check: "Ask organisers where their last custom badge was made, and what it cost.",
  },
  {
    area: "User",
    icon: Brush,
    tint: "linear-gradient(135deg, #e3eee0, #cfe4d6)",
    text: "The organiser is creative, but doesn't have the bandwidth to design the badge themselves.",
    check: "Interview five organisers about who designs their badge, and how long it takes.",
  },
  {
    area: "Market",
    icon: Store,
    tint: "linear-gradient(135deg, #f1e6d6, #ead6bd)",
    text: "There are lots of badge options on the market, so keeping this inside Planned matters.",
    check: "Map the badge tools and vendors organisers already use.",
  },
  {
    area: "Trust",
    icon: Handshake,
    tint: "linear-gradient(135deg, #e6e9ec, #d6dce1)",
    text: "Organisers will welcome an agent that drafts before they ask, as long as they choose the final look.",
    check: "Put ready-made drafts in front of organisers and watch which they keep, steer or reject.",
  },
]


function AssumptionsFigure() {
  return (
    <ol className={`grid w-full gap-3 sm:grid-cols-2 ${FONT}`}>
      {ASSUMPTIONS.map((a, k) => {
        const Icon = a.icon
        return (
          <li key={a.area} className="flex flex-col rounded-[16px] border bg-white p-4" style={{ borderColor: "#ebebe9" }}>
            <div className="flex items-center gap-3">
              {/* A soft tile in Planned's palette, one per kind of assumption. */}
              <span
                className="flex size-[38px] shrink-0 items-center justify-center rounded-[11px] text-[#21333A]"
                style={{ background: a.tint, boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.6)" }}
              >
                <Icon className="size-[17px]" strokeWidth={1.7} />
              </span>
              <div className="min-w-0 flex-1">
                <div className="text-[12.5px] font-semibold text-[#1d1d1b]">{a.area}</div>
                <div className="font-mono text-[10.5px] text-[#9a9a96]">{String(k + 1).padStart(2, "0")}</div>
              </div>
            </div>
            <p className="mt-3.5 text-[14px] leading-[1.45] font-medium text-[#1d1d1b]">{a.text}</p>
            <p className="mt-auto pt-3 text-[12.5px] leading-[1.45] text-[#6b6b68]">
              <span className="font-medium text-[#4a4a48]">How I&apos;d check: </span>
              {a.check}
            </p>
          </li>
        )
      })}
    </ol>
  )
}

/** The four rules that keep a proactive agent helpful rather than pushy. */
const PRINCIPLES: { icon: typeof Eye; title: string; text: string; where: string }[] = [
  {
    icon: PackageCheck,
    title: "Come prepared",
    text: "Draft before anyone asks, from what Planned already knows. With nothing to go on, ask for the one thing it needs.",
    where: "Three drafts are waiting when Badges opens.",
  },
  {
    icon: Eye,
    title: "Show the work, flag doubts",
    text: "Say what the drafts drew on, and say plainly when something looks off, rather than passing a guess off as finished.",
    where: "Drafted from 4 sources",
  },
  {
    icon: UserCheck,
    title: "Steer, undo, decide",
    text: "Nothing is applied or ordered without the organiser. A change is one line away, and the standard badge one click away.",
    where: "Ask for changes, and Review order",
  },
  {
    icon: SlidersHorizontal,
    title: "Speak up rarely",
    text: "Work quietly in the background, and only nudge when something needs the organiser, like an approaching print deadline.",
    where: "No notifications; the drafts are simply there.",
  },
]

function PrinciplesFigure() {
  return (
    <ol className={`grid w-full gap-3 sm:grid-cols-2 ${FONT}`}>
      {PRINCIPLES.map((p, k) => {
        const Icon = p.icon
        return (
          <li key={p.title} className="flex flex-col rounded-[16px] border bg-white p-4" style={{ borderColor: "#ebebe9" }}>
            <div className="flex items-center gap-3">
              <span
                className="flex size-[38px] shrink-0 items-center justify-center rounded-[11px] text-[#21333A]"
                style={{ background: ["linear-gradient(135deg, #d6ece9, #c2e0e1)", "linear-gradient(135deg, #f4eccf, #f3dcae)", "linear-gradient(135deg, #dce8f1, #c9dceb)", "linear-gradient(135deg, #e3eee0, #cfe4d6)"][k], boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.6)" }}
              >
                <Icon className="size-[17px]" strokeWidth={1.7} />
              </span>
              <div>
                <div className="text-[14px] font-medium text-[#1d1d1b]">{p.title}</div>
                <div className="font-mono text-[10.5px] text-[#9a9a96]">{String(k + 1).padStart(2, "0")}</div>
              </div>
            </div>
            <p className="mt-3 text-[13.5px] leading-[1.45] text-[#1d1d1b]">{p.text}</p>
            <p className="mt-auto pt-3 text-[12.5px] leading-[1.45] text-[#6b6b68]">
              <span className="font-medium text-[#4a4a48]">On the page: </span>
              {p.where}
            </p>
          </li>
        )
      })}
    </ol>
  )
}

/**
 * The thesis in one picture: the same job done by hand, step by step, beside
 * an agent that has done the legwork and leaves the organiser one decision.
 */
function ManualVsAgent() {
  const manual = [
    "Find the brand colours",
    "Track down the logo and fonts",
    "Choose a template",
    "Pick colours for each attendee type",
    "Lay out the name, role and company",
    "Check it's readable",
    "Work out how many to print",
  ]
  const agent = ["Three on-brand drafts are waiting", "Pick one, or ask for a change"]
  return (
    <div className={`grid w-full gap-3 sm:grid-cols-2 ${FONT}`}>
      <div className="flex flex-col rounded-[16px] border bg-white p-4" style={{ borderColor: "#ebebe9" }}>
        <div className="flex items-baseline justify-between">
          <span className="text-[13px] font-medium text-[#1d1d1b]">By hand</span>
          <span className="text-[11.5px] text-[#9a9a96]">{manual.length} steps</span>
        </div>
        <ol className="mt-3 flex flex-col gap-1.5">
          {manual.map((m, k) => (
            <li key={m} className="flex items-center gap-2.5 rounded-[9px] px-2.5 py-[6px] text-[12.5px] text-[#4a4a48]" style={{ background: "#f6f6f4" }}>
              <span className="w-[14px] font-mono text-[10.5px] text-[#a3a3a0]">{k + 1}</span>
              {m}
            </li>
          ))}
        </ol>
      </div>
      <div className="flex flex-col rounded-[16px] border bg-white p-4" style={{ borderColor: "#ebebe9" }}>
        <div className="flex items-baseline justify-between">
          <span className="flex items-center gap-1.5 text-[13px] font-medium text-[#1d1d1b]">
            <AiLabel size={12} />
            With the agent
          </span>
          <span className="text-[11.5px] text-[#9a9a96]">{agent.length} steps</span>
        </div>
        <ol className="mt-3 flex flex-col gap-1.5">
          {agent.map((m, k) => (
            /* Cotton candy: pink into lilac into a soft blue, like Planned's app icon. */
            <li
              key={m}
              className="flex items-center gap-2.5 rounded-[9px] px-2.5 py-[6px] text-[12.5px] text-[#1d1d1b]"
              style={{ background: "linear-gradient(120deg, #FDEFF5 0%, #F6F1FC 50%, #EEF4FE 100%)", boxShadow: "inset 0 0 0 1px rgba(196, 170, 226, 0.25)" }}
            >
              <span className="w-[14px] font-mono text-[10.5px] text-[#B386C4]">{k + 1}</span>
              {m}
            </li>
          ))}
        </ol>
        <p className="mt-auto pt-4 text-[12px] leading-[1.5] text-[#6b6b68]">
          The legwork in between still happens. The agent does it ahead of time, using what the platform already knows, and leaves the organiser the one part that needs their judgement.
        </p>
      </div>
    </div>
  )
}

/* ---------- Shared figure layouts ---------- */

const TINTS = [
  "linear-gradient(135deg, #d6ece9, #c2e0e1)",
  "linear-gradient(135deg, #f4eccf, #f3dcae)",
  "linear-gradient(135deg, #dce8f1, #c9dceb)",
  "linear-gradient(135deg, #e3eee0, #cfe4d6)",
]

/** A grid of small cards: an icon tile, a title, a line, and a footnote. */
function InfoCards({ items, noteLabel }: { items: { icon: typeof Eye; title: string; text: string; note: string }[]; noteLabel: string }) {
  return (
    <ol className={`grid w-full gap-3 ${items.length === 3 ? "sm:grid-cols-3" : "sm:grid-cols-2"} ${FONT}`}>
      {items.map((it, k) => {
        const Icon = it.icon
        return (
          <li key={it.title} className="flex flex-col rounded-[16px] border bg-white p-4" style={{ borderColor: "#ebebe9" }}>
            <span
              className="flex size-[38px] items-center justify-center rounded-[11px] text-[#21333A]"
              style={{ background: TINTS[k % TINTS.length], boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.6)" }}
            >
              <Icon className="size-[17px]" strokeWidth={1.7} />
            </span>
            <div className="mt-3 text-[14px] font-medium text-[#1d1d1b]">{it.title}</div>
            <p className="mt-1 text-[13px] leading-[1.45] text-[#4a4a48]">{it.text}</p>
            <p className="mt-auto pt-3 text-[12.5px] leading-[1.45] text-[#6b6b68]">
              <span className="font-medium text-[#4a4a48]">{noteLabel} </span>
              {it.note}
            </p>
          </li>
        )
      })}
    </ol>
  )
}

/** A vertical timeline: a dot per step, a line between, and an optional tag. */
function Timeline({ steps }: { steps: { when: string; text: string; tag?: string; loud?: boolean }[] }) {
  return (
    <ol className={`w-full max-w-[560px] ${FONT}`}>
      {steps.map((st, k) => (
        <li key={st.when} className="relative flex gap-4 pb-5 last:pb-0">
          {k < steps.length - 1 && <span aria-hidden className="absolute top-[18px] left-[8.5px] h-[calc(100%-14px)] w-px bg-[#e3e3e0]" />}
          <span
            className="relative mt-[3px] size-[18px] shrink-0 rounded-full"
            style={
              // The site's own style: the step to start with in ink, the rest as rings.
              st.loud
                ? { background: "#1d1d1b", boxShadow: "inset 0 0 0 4px #fff, 0 0 0 1.5px #1d1d1b, 0 0 0 4px #fff" }
                : { background: "#fff", boxShadow: "inset 0 0 0 1.5px #c9c9c6, 0 0 0 3px #fff" }
            }
          />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[14px] font-medium text-[#1d1d1b]">{st.when}</span>
              {st.tag && (
                <span
                  className="rounded-full px-2 py-[1px] text-[11px]"
                  style={st.loud ? { background: "#ebebe9", color: "#1d1d1b" } : { background: "#f1f1ee", color: "#6b6b68" }}
                >
                  {st.tag}
                </span>
              )}
            </div>
            <p className="mt-0.5 text-[13px] leading-[1.45] text-[#4a4a48]">{st.text}</p>
          </div>
        </li>
      ))}
    </ol>
  )
}

/* ---------- The case study ---------- */

export const PLANNED_CASE: CaseStudy = {
  title: "Planned Badges",
  summary:
    "A concept for Planned, and a case for interfaces that are ready for an agentic world: less manual work on repetitive tasks, and an agent that uses context to get there first. Here, on-brand badges are drafted before the organiser asks.",
  facts: [
    { label: "Company", value: "Planned (concept)" },
    { label: "Role", value: "Product Designer" },
    { label: "Team", value: "Solo" },
    { label: "Timeline", value: "2026-11" },
  ],
  hero: <PlannedCaseHero />,
  sections: [
    {
      id: "thesis",
      label: "Thesis",
      title: "Interfaces for an agentic world",
      blurb: [
        "Software is starting to do more of the work, not just hold it. I think our interfaces need to be ready for that: less manual effort, especially on routine tasks, and an agent that uses the context it already has to be one step ahead of the person it's helping.",
        "Event badges are a small, concrete place to show what that looks like. Designing one by hand takes a string of small, routine decisions. With the context a platform like Planned likely already has, an agent can make the first pass, so the organiser only makes the call that needs them.",
      ],
      media: {
        kind: "demo",
        caption: "The same badge, made by hand or with the agent. The steps are illustrative, not measured.",
        node: <ManualVsAgent />,
      },
    },
    {
      id: "problem",
      label: "Problem",
      title: "A strong foundation",
      blurb: [
        "Planned's badge builder already gets the essentials right. Organisers choose a size, a template, a colour per attendee type and what each badge shows. From the outside, the templates seem to put legibility first, which is what a badge needs to do.",
        "Badges also travel further than most of an event's brand. Having worked events, I've seen people wear them all day: at the sessions, at lunch, at the dinner afterwards. Yet in my experience the badge is often one of the last jobs on an organiser's list, and my guess is most don't have the time to brand it themselves.",
        "Planned already calls itself the AI operating system for events, and I'm assuming it already holds most of what an agent would need to help: each event's website, brand and photos.",
      ],
      media: {
        kind: "demo",
        caption: "The badge builder today, recreated.",
        tag: "Today",
        node: <PageFigure ai={false} />,
        fullPage: "#planned-today",
      },
    },
    {
      id: "assumptions",
      label: "Assumptions",
      title: "What I'm assuming going in",
      blurb: [
        "As a concept from outside the company, this rests on assumptions I haven't been able to test yet. I've written them down so they can be checked, not taken as given.",
        "If any of them turn out to be wrong, the design should change with them.",
      ],
      media: {
        kind: "demo",
        caption: "Six assumptions, none tested yet, and how I'd check each one.",
        node: <AssumptionsFigure />,
      },
    },
    {
      id: "approach",
      label: "Approach",
      title: "A step ahead of the organiser",
      blurb: [
        "If Planned already knows each event's website, brand and photos, as I'm assuming it does, the agent doesn't need a brief. When the organiser opens Badges, three styles are already drafted, one suggested. In the prototype, they come from planned.com.",
        "The organiser stays in control: nothing is applied until they pick a draft, a change is one line away, and names and IDs never move. Everything else works as it does today. The agent also has a print order ready, sized from the guest list, though I don't know how Planned handles printing, so that part is my best guess.",
      ],
      media: {
        kind: "demo",
        caption: "The prototype: styles already drafted from planned.com when the organiser arrives.",
        interactive: true,
        node: <PageFigure ai />,
        fullPage: "#planned",
      },
    },
    {
      id: "principles",
      label: "Principles",
      title: "Prepared, not presumptuous",
      blurb: [
        "My hunch is that a proactive agent is only welcome if it stays out of the way. These four rules aren't specific to badges; they're how I'd approach any agentic interface, and they're among the first things I'd want to test.",
      ],
      media: {
        kind: "demo",
        caption: "The four rules the agent follows, and where each shows up on the page.",
        node: <PrinciplesFigure />,
      },
    },
    {
      id: "unsure",
      label: "Unsure",
      title: "When the agent isn't sure",
      blurb: [
        "I'd expect an agent that comes prepared to sometimes come prepared with the wrong thing. My guess is that brand data is often messy: a low-res logo, colours that drift across a website, an old site that hasn't been updated. And I'd imagine some events won't have a website or brand to work from at all.",
        "So I've designed the agent to say what it isn't sure about rather than pass a guess off as finished, to ask for the one thing it needs when it has nothing to go on, and to never take away the way out. Whether that's enough to keep organisers' trust is something I'd want to test.",
      ],
      media: {
        kind: "demo",
        caption: "Three ways the agent handles being wrong, unsure or empty-handed.",
        node: (
          <InfoCards
            noteLabel="In the prototype:"
            items={[
              { icon: CircleAlert, title: "Flag the problem", text: "Say plainly what looks off, and offer the fix right there.", note: "Not built yet. A short note under the drafts, like a logo too low-res for print, with the fix beside it." },
              { icon: Globe, title: "Ask for what it needs", text: "With no website or brand yet, ask for the one thing that unlocks the drafts, and keep watching for the event site.", note: "Open the full page with no context to try it." },
              { icon: RotateCcw, title: "An easy way out", text: "Nothing is applied until picked, and the standard badge is always one click away.", note: "Click the chosen draft again to go back." },
            ]}
          />
        ),
        fullPage: "#planned-empty",
      },
    },
    {
      id: "skills",
      label: "Skills",
      title: "Five skills behind one card",
      blurb: [
        "The way I picture it, the agent can be a step ahead because its work is split into skills that run in the background, each with one job. Two read what I'm assuming Planned already knows, the event's website and its photos, long before anyone opens Badges. One reads any note the organiser adds. One composes the drafts with a sense of taste, and the last checks every draft for accessibility before anyone sees it.",
        "My thinking is that splitting it up would let each skill be written, tested and improved on its own, and would make the accessibility check hard to skip: a draft that fails is sent back, not shown.",
      ],
      media: {
        kind: "demo",
        caption: "The skills behind the Badge style card, and what each found for Planned Live.",
        interactive: true,
        node: <SkillsFigure />,
      },
    },
    {
      id: "next",
      label: "What's next",
      title: "What I'd measure and ship first",
      blurb: [
        "I wouldn't ship this all at once. The first step is just the drafts, then steering, and each one should earn the next.",
        "To know whether it's working, I'd watch whether organisers keep the suggested drafts, how long it takes to reach a finished badge, how often they steer, and how many print orders come through Planned rather than outside vendors. Each ties back to one of the assumptions.",
        "The biggest open question for me is whether organisers actually want an agent this proactive, or would rather start from a blank template and stay in full control. That's the first thing I'd want to learn, and the answer would shape everything above.",
      ],
      media: {
        kind: "demo",
        caption: "A possible rollout, smallest useful step first.",
        node: (
          <Timeline
            steps={[
              { when: "1. Drafts from the website", text: "Three styles from the event's site, ready when Badges opens. Pick one or keep the standard badge.", tag: "Start here", loud: true },
              { when: "2. Steering", text: "Ask for changes, add sources, attach pictures, and see how the drafts were made." },
              { when: "3. Beyond badges", text: "The same agent drafts signage, the agenda layout and the event app from the same brand." },
            ]}
          />
        ),
      },
    },
  ],
}
