import { useEffect, useLayoutEffect, useRef, useState } from "react"
import { ArrowRight, ArrowUpRight, Brush, Eye, Handshake, LayoutTemplate, PackageCheck, ScanLine, SlidersHorizontal, Store, TrendingUp, UserCheck } from "lucide-react"

import type { CaseStudy } from "./case-study"
import { AiLabel, Badge, BrandArt, DRAFTS, LanyardClip, PLAIN, PlannedBadge, PlannedLogo, SlotRim, slotMask, type Pattern, type Style } from "./planned-badge"
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

/** The same attendee, the same details: today's badge beside a branded one. */
function PlainVsBranded() {
  const tide = DRAFTS[0]!  // Golden hour
  return (
    <div className={`flex w-full flex-col items-center gap-8 sm:flex-row sm:justify-center sm:gap-12 ${FONT}`}>
      {[
        { label: "Today", s: PLAIN, accent: PLAIN.accent, pattern: "none" as Pattern },
        { label: "With the event's brand", s: tide, accent: tide.accent, pattern: tide.pattern },
      ].map(({ label, s, accent, pattern }) => (
        <div key={label} className="flex flex-col items-center gap-3">
          <div className="origin-top scale-[0.72]" style={{ marginBottom: -112 }}>
            <Badge size="portrait" template="window" role="General" style={s} accent={accent} pattern={pattern} showName showCompany />
          </div>
          <span className="text-[12.5px] font-medium text-[#4a4a4a]">{label}</span>
        </div>
      ))}
    </div>
  )
}

/** One drafted style across attendee types: the frame changes, the name never moves. */
function PatternRange() {
  const s = DRAFTS[0]!
  return (
    <div className={`grid w-full grid-cols-2 justify-items-center gap-x-4 gap-y-6 sm:grid-cols-4 ${FONT}`}>
      {(["General", "VIP", "Speaker", "Staff"] as const).map((role) => (
        <div key={role} className="flex flex-col items-center gap-2">
          <div style={{ width: 118, height: 168 }}>
            <div className="origin-top-left scale-[0.42]" style={{ width: 280 }}>
              <Badge size="portrait" template="window" role={role} style={s} accent={s.accent} pattern="none" showName showCompany={false} />
            </div>
          </div>
          <span className="text-[12px] text-[#4a4a4a]">{role}</span>
        </div>
      ))}
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

/** Status-bar glyphs: signal, wi-fi and battery. */
function StatusIcons() {
  return (
    <span className="flex items-center gap-[3px] text-[#1d1d1b]">
      <svg width="11" height="7" viewBox="0 0 15 9" aria-hidden>
        {[0, 1, 2, 3].map((k) => (
          <rect key={k} x={k * 4} y={6 - k * 2} width="3" height={3 + k * 2} rx="0.8" fill="currentColor" />
        ))}
      </svg>
      <svg width="10" height="7" viewBox="0 0 13 9" aria-hidden fill="currentColor">
        <path d="M6.5 8.6 4.6 6.6a2.7 2.7 0 0 1 3.8 0Z" />
        <path d="M2.9 4.9a5.1 5.1 0 0 1 7.2 0l-1 1a3.7 3.7 0 0 0-5.2 0Z" />
        <path d="M1.1 3.1a7.7 7.7 0 0 1 10.8 0l-1 1a6.3 6.3 0 0 0-8.8 0Z" />
      </svg>
      <span className="relative flex h-[7px] w-[14px] items-center rounded-[2px] border border-current/40 p-[1px]">
        <span className="h-full w-[75%] rounded-[1px] bg-current" />
        <span className="absolute -right-[2px] h-[2.5px] w-[1px] rounded-r-full bg-current/40" />
      </span>
    </span>
  )
}

/**
 * A phone, drawn with care: a slim titanium frame and side buttons, the
 * Dynamic Island, a status bar, and a browser's floating address bar over an
 * event website in the badge's own style.
 */
function EventPhone({ style: s }: { style: Style }) {
  return (
    <div className="relative shrink-0" style={{ width: 214, height: 438 }}>
      {/* Side buttons. */}
      <span className="absolute top-[92px] -left-[2px] h-[22px] w-[3px] rounded-l-[2px] bg-[#3a3a38]" />
      <span className="absolute top-[124px] -left-[2px] h-[38px] w-[3px] rounded-l-[2px] bg-[#3a3a38]" />
      <span className="absolute top-[170px] -left-[2px] h-[38px] w-[3px] rounded-l-[2px] bg-[#3a3a38]" />
      <span className="absolute top-[134px] -right-[2px] h-[58px] w-[3px] rounded-r-[2px] bg-[#3a3a38]" />
      {/* Frame: a thin metal edge around a black bezel. */}
      <div
        className="absolute inset-0 rounded-[38px] p-[3px]"
        style={{
          background: "linear-gradient(145deg, #8d8f8c, #4a4b49 40%, #2b2c2a 60%, #77797a)",
          boxShadow: "0 30px 60px -28px rgba(15,15,15,0.5), 0 10px 20px -12px rgba(15,15,15,0.3)",
        }}
      >
        <div className="h-full w-full rounded-[35px] bg-[#0d0d0c] p-[6px]">
          <div className="relative h-full w-full overflow-hidden rounded-[30px] bg-white" style={{ fontFamily: "Geist, 'Inter Variable', Inter, sans-serif" }}>
            {/* Status bar and the Dynamic Island. */}
            <div className="absolute inset-x-0 top-0 z-20 flex h-[33px] items-center justify-between px-[20px] pt-[1px]">
              <span className="text-[9px] font-semibold text-[#1d1d1b] tabular-nums">9:41</span>
              <StatusIcons />
            </div>
            <span className="absolute top-[8px] left-1/2 z-30 h-[17px] w-[46px] -translate-x-1/2 rounded-full bg-black" />

            {/* The website. */}
            <div className="view-in absolute inset-0 overflow-hidden" style={{ animationDelay: "400ms" }}>
              {/* Site header: sticky nav over the hero. */}
              <div className="relative overflow-hidden pt-[34px]" style={{ background: s.surface, color: s.ink }}>
                {s.art && <BrandArt art={s.art} />}
                <div className="relative flex items-center justify-between px-3.5 py-2">
                  <span className="flex items-center gap-1.5">
                    <PlannedLogo size={13} />
                    <span className="text-[10px] font-semibold tracking-[-0.01em]">Planned Live</span>
                  </span>
                  <span className="flex flex-col gap-[3px]" aria-hidden>
                    <span className="h-[1.5px] w-[12px] rounded-full bg-current" />
                    <span className="h-[1.5px] w-[12px] rounded-full bg-current" />
                  </span>
                </div>
                <div className="relative px-3.5 pt-3 pb-4">
                  <span className="inline-flex rounded-full px-2 py-[2px] text-[7.5px] font-semibold tracking-[0.12em] uppercase" style={{ background: "rgba(255,255,255,0.55)" }}>
                    Day 1 · Live now
                  </span>
                  <div className="mt-2 text-[24px] leading-[0.95] font-medium tracking-[-0.035em]">
                    Planned
                    <br />
                    Live
                  </div>
                  <div className="mt-1.5 text-[8.5px] leading-[1.45] text-[#3F4D4F] tabular-nums">
                    2026-10-06 – 2026-10-08 · San Francisco
                  </div>
                  <div className="mt-3 flex gap-1.5">
                    <span className="rounded-full bg-[#21333A] px-3 py-[5px] text-[9px] font-medium whitespace-nowrap text-white">View agenda</span>
                    <span className="rounded-full bg-white/70 px-3 py-[5px] text-[9px] font-medium whitespace-nowrap text-[#21333A]">Get the app</span>
                  </div>
                </div>
              </div>

              {/* Today's agenda, as cards. */}
              <div className="bg-[#FCFBF4] px-3.5 pt-3">
                <div className="flex items-baseline justify-between">
                  <span className="text-[11px] font-semibold text-[#21333A]">Today</span>
                  <span className="text-[8.5px] text-[#7a8786]">Full agenda →</span>
                </div>
                {[
                  ["09:00", "Opening keynote", "Main stage", true],
                  ["11:30", "Designing for attendees", "Workshop room B", false],
                  ["13:00", "Lunch on the terrace", "Level 2", false],
                ].map(([t, what, where, now]) => (
                  <div key={t as string} className="mt-1.5 flex items-center gap-2.5 rounded-[10px] border border-[#efeee8] bg-white px-2.5 py-[7px]">
                    <span className="w-[26px] text-[8.5px] text-[#7a8786] tabular-nums">{t}</span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[9.5px] font-medium text-[#21333A]">{what}</span>
                      <span className="block text-[8px] text-[#7a8786]">{where}</span>
                    </span>
                    {now && <span className="rounded-full bg-[#d6ece9] px-1.5 py-[1px] text-[7px] font-semibold text-[#294B4F]">Now</span>}
                  </div>
                ))}
              </div>
            </div>

            {/* The browser's floating address bar, and the home indicator. */}
            <div className="absolute inset-x-0 bottom-0 z-20 px-2.5 pt-6 pb-[6px]" style={{ background: "linear-gradient(to top, rgba(252,251,244,1) 55%, rgba(252,251,244,0))" }}>
              <div className="flex items-center justify-center gap-1 rounded-[12px] bg-white/90 py-[7px] text-[9.5px] text-[#1d1d1b] shadow-[0_2px_10px_rgba(15,15,15,0.12)] backdrop-blur-md">
                <svg width="7" height="9" viewBox="0 0 7 9" aria-hidden fill="#7a7a77">
                  <rect x="0.5" y="4" width="6" height="4.5" rx="1" />
                  <path d="M1.8 4V2.8a1.7 1.7 0 0 1 3.4 0V4" fill="none" stroke="#7a7a77" strokeWidth="1" />
                </svg>
                planned.com/live
              </div>
              <div className="mx-auto mt-[7px] h-[3.5px] w-[70px] rounded-full bg-[#1d1d1b]" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

/**
 * The badge's code, doing its second job: a phone scans it and lands on the
 * page the organiser chose, here the event's agenda.
 */
function CodeFigure() {
  const s = DRAFTS[0]!
  return (
    <div className={`flex w-full flex-col items-center gap-6 sm:flex-row sm:justify-center sm:gap-10 ${FONT}`}>
      {/* The badge, with its code picked out. */}
      <div style={{ width: 196, height: 280 }} className="relative shrink-0">
        <div className="origin-top-left scale-[0.7]" style={{ width: 280 }}>
          <div className="relative">
            <Badge size="portrait" template="window" role="General" style={s} accent={s.accent} pattern="none" showName showCompany link="planned.com/live" highlightCode />
          </div>
        </div>
      </div>

      {/* The scan. */}
      <div className="flex items-center gap-2 text-[12px] text-[#6b6b68] sm:flex-col">
        <ScanLine className="size-[18px]" strokeWidth={1.6} />
        <span>Scanned with any phone</span>
        <ArrowRight className="size-[14px] rotate-90 sm:rotate-0" strokeWidth={1.8} />
      </div>

      {/* The phone, open on the organiser's page. */}
      <EventPhone style={s} />
    </div>
  )
}

/** The four rules that keep a proactive agent helpful rather than pushy. */
const PRINCIPLES: { icon: typeof Eye; title: string; text: string; where: string }[] = [
  {
    icon: PackageCheck,
    title: "Come prepared",
    text: "Draft before anyone asks, from what Planned already knows about the event.",
    where: "Three drafts are waiting when Badges opens.",
  },
  {
    icon: Eye,
    title: "Show the work",
    text: "Say what each draft took from each source, in plain words, so nothing feels like magic.",
    where: "How these were drafted",
  },
  {
    icon: SlidersHorizontal,
    title: "Easy to steer",
    text: "Asking for a change takes one line, and the agent redrafts.",
    where: "Ask for changes, in a line",
  },
  {
    icon: UserCheck,
    title: "Never decide alone",
    text: "Suggest, never commit. Nothing is applied, printed or ordered without the organiser.",
    where: "Suggested, not final; the order waits for a click.",
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
  const agent = ["Open Badges: three on-brand drafts are waiting", "Pick one, or ask for a change"]
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
            <li key={m} className="flex items-center gap-2.5 rounded-[9px] px-2.5 py-[6px] text-[12.5px] text-[#21333A]" style={{ background: "linear-gradient(135deg, rgba(214,236,233,0.7), rgba(244,236,207,0.5))" }}>
              <span className="w-[14px] font-mono text-[10.5px] text-[#7a8786]">{k + 1}</span>
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

/* ---------- The case study ---------- */

export const PLANNED_CASE: CaseStudy = {
  title: "Planned Badges",
  summary:
    "A concept for Planned, and a case for interfaces that are ready for an agentic world: less manual work on menial tasks, and an agent that uses context to get there first. Here, on-brand badges are drafted before the organiser asks.",
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
        "Software is starting to do more of the work, not just hold it. I think our interfaces need to be ready for that: less manual effort, especially on the menial tasks, and an agent that uses the context it already has to be one step ahead of the person it's helping.",
        "Event badges are a small, concrete place to show what that looks like. Designing one by hand takes a string of small, menial decisions. With the context a platform like Planned likely already has, an agent can make the first pass, so the organiser only makes the call that needs them.",
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
        "That foundation leaves room for one more layer: an agent that does the first draft before anyone asks. Planned already calls itself the AI operating system for events, and I'm assuming it already holds most of what that agent would need: each event's website, brand and photos.",
      ],
      media: {
        kind: "demo",
        caption: "The badge builder today, recreated.",
        tag: "Today",
        node: <PageFigure ai={false} />,
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
      id: "opportunity",
      label: "Opportunity",
      title: "A badge is marketing that walks around",
      blurb: [
        "Having worked events, I've seen how far a badge travels. Every person wears one all day: at the sessions, at lunch, in the lobby, at the dinner afterwards. Everyone who passes them sees the event's brand.",
        "That makes the badge one of the most seen pieces of an event's identity, yet in my experience it's often one of the last jobs on an organiser's list. My guess is that most aren't designers and few have the time, so an agent that has already done the first draft could go a long way.",
      ],
      media: {
        kind: "demo",
        caption: "The same attendee, before and after the brand.",
        node: <PlainVsBranded />,
      },
    },
    {
      id: "approach",
      label: "Approach",
      title: "A step ahead of the organiser",
      blurb: [
        "If Planned already knows a lot about each event, as I'm assuming it does (its website, brand colours, photos and type), then the agent doesn't need to wait for a brief. It can arrive prepared. When the organiser opens Badges, three styles are already drafted, with one suggested. In the prototype, Planned is running its own event, so the drafts come from planned.com: its hazy evening skies, soft grey cloud, feathered mint paint and heavy grain, set in its slate-teal ink.",
        "Everything stays in the organiser's hands. Nothing is applied until they pick a draft, and they don't have to: the standard badge is always there. They can ask for a change in a line, like “warmer”, and a short note shows which sources the drafts drew on.",
        "The agent is marked with Planned's own gradient circle, so it feels native to the product rather than bolted on. Size, template, attendee colours and content all work exactly as they do today. It even has the order ready: once the look is set, the printed badges are sized from the guest list with spares for walk-ins, waiting for one click. I don't know how Planned handles printing today, so this is my best guess at where ordering would sit.",
      ],
      media: {
        kind: "demo",
        caption: "The prototype: styles already drafted from planned.com when the organiser arrives.",
        interactive: true,
        node: <PageFigure ai />,
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
      id: "empty",
      label: "No context",
      title: "When there's nothing to go on yet",
      blurb: [
        "I don't know exactly how events get set up in Planned, but I'd expect that not every one starts with a website and a brand kit. When the agent has nothing to go on, it doesn't fall back to an empty prompt. It says the one thing it needs, offers a one-click way to give it, and keeps watching, so the drafts appear on their own once the event's site goes live.",
        "Nothing is blocked while it waits: today's templates and colours all still work, so the organiser can carry on and come back to the style later.",
      ],
      media: {
        kind: "demo",
        caption: "The same page with nothing to go on yet. Try “Use the event website”.",
        interactive: true,
        node: <PageFigure ai known={false} />,
      },
    },
    {
      id: "skills",
      label: "Skills",
      title: "Five skills behind one card",
      blurb: [
        "The agent can be a step ahead because its work is split into skills that run in the background, each with one job. Two read what I'm assuming Planned already knows, the event's website and its photos, long before anyone opens Badges. One reads any note the organiser adds. One composes the drafts with a sense of taste, and the last checks every draft for accessibility before anyone sees it.",
        "Splitting it up means each skill can be written, tested and improved on its own, and the accessibility check can't be skipped. A draft that fails is sent back, not shown.",
      ],
      media: {
        kind: "demo",
        caption: "The skills behind the Badge style card, and what each found for Planned Live.",
        interactive: true,
        node: <SkillsFigure />,
      },
    },
    {
      id: "control",
      label: "Control",
      title: "Steer it, don't build it",
      blurb: [
        "The drafts are a starting point, not a decision. The organiser picks the one that feels right, and if none do, they steer: ask for a change in a line, and the agent redrafts. There's no design tool to learn, and every draft keeps the badge as legible as the templates it builds on.",
        "Names, roles and IDs keep their place and size in every style, so the badge still does its first job at a glance.",
      ],
      media: {
        kind: "demo",
        caption: "One style across attendee types. The frame colour changes, the name never moves.",
        node: <PatternRange />,
      },
    },
    {
      id: "code",
      label: "Code",
      title: "Every badge, a way in",
      blurb: [
        "Event badges often carry a code next to the attendee's ID, and I'm assuming Planned's could too. It could also open a page the organiser chooses for anyone who scans it with a phone: the agenda, the event app, a sponsor's offer or a sign-up for next year.",
        "That could turn hundreds of badges into hundreds of ways in, and every scan would be a moment the organiser can see and count. Here too the agent comes prepared: it points the code at the agenda during the event, and could suggest switching it to the feedback survey once the event is over.",
      ],
      media: {
        kind: "demo",
        caption: "The code on the badge, opening the event's agenda on any phone.",
        node: <CodeFigure />,
      },
    },
    {
      id: "next",
      label: "What's next",
      title: "What I'd test next",
      blurb: [
        "First, whether the agent earns its place: how often organisers keep the suggested draft, how often they steer it, and whether arriving prepared feels helpful or presumptuous. Then the practical side: on-site printers often print attendee details in black only, so styles would need to live on the pre-printed stock while names stay crisp in black.",
        "Beyond badges, the same pattern could take on other menial parts of running an event: drafting the agenda layout, the event app and the signage from the same brand, so organisers spend their time on decisions, not set-up.",
      ],
      media: {
        kind: "demo",
        caption: "Three directions drawn from planned.com.",
        node: (
          <div className={`flex w-full flex-col items-center gap-6 sm:flex-row sm:justify-center sm:gap-6 ${FONT}`}>
            {DRAFTS.map((d) => (
              <div key={d.id} className="flex flex-col items-center gap-2">
                {/* Sized to the badge as it's shown, so the row packs tightly. */}
                <div style={{ width: 140, height: 200 }}>
                  <div className="origin-top-left scale-[0.5]" style={{ width: 280 }}>
                    <Badge size="portrait" template="window" role="General" style={d} accent={d.accent} pattern={d.pattern} showName showCompany />
                  </div>
                </div>
                <span className="text-[12px] text-[#4a4a4a]">{d.name}</span>
              </div>
            ))}
          </div>
        ),
      },
    },
  ],
}
