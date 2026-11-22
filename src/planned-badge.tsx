import { useEffect, useId, useRef, useState } from "react"
import {
  ArrowLeft,
  ArrowUp,
  BarChart3,
  Box,
  CalendarDays,
  ChevronDown,
  ClipboardList,
  Globe,
  Home,
  Mail,
  PanelLeft,
  Ticket,
  BedDouble,
  Check,
  Pencil,
  Printer,
  FileText,
  Image as ImageIcon,
  Link2,
  Paperclip,
  Plus,
  Upload,
  Users,
  X,
  House,
  MessageSquare,
  Store,
  UsersRound,
  Columns3,
  FilePenLine,
  Receipt,
  MapPinned,
  ListChecks,
  LayoutGrid,
  Mails,
  Palette,
  Inbox,
} from "lucide-react"

/*
 * A concept for Planned's badge builder: the Badges page as it is today, with
 * a proactive layer of AI on top. Planned already knows the event's website,
 * brand colours, photos and type, so three branded styles are drafted before
 * the organiser arrives. They pick one, switch a source off, or ask for a
 * change in a line. Everything else (size, template, attendee colours,
 * content) works as before, and the badge on the right shows every choice
 * as it's made. The event and people are invented.
 */

const FONT = "font-['Geist','Inter_Variable',Inter,system-ui,sans-serif]"
const INK = "#1d1d1b"
const MUTED = "#6b6b68"
// Outlines follow a CSS variable: the new version sets a cool blue-grey,
// today's falls back to the original warm grey.
const LINE = "var(--line, #e7e7e4)"
// Fills follow variables too: cool blue-grey in the new version, warm today.
const PANEL = "var(--panel, #f7f7f5)"
// Selected states: blue in the new version, Planned's black today.
const SELECT = "var(--select, #1d1d1b)"
const SWITCH = "var(--select, #2b2f2f)"
const SELECT_BG = "var(--select-bg, #f7f7f5)"

/* ---------- Options ---------- */

type Size = "portrait" | "landscape"
type Template = "window" | "band" | "big"
export type Pattern = "none" | "waves" | "dots" | "grid"

const ROLES = [
  { id: "General", color: "#4B909A" },
  { id: "VIP", color: "#E39B2D" },
  { id: "Speaker", color: "#5B6CC4" },
  { id: "Staff", color: "#4E8F86" },
  { id: "Supplier", color: "#2F3B3B" },
] as const
type Role = (typeof ROLES)[number]["id"]

/**
 * Attendee colours for the AI-drafted styles, drawn from Planned's palette so
 * the frame sits with the drafts: teal, warm gold, dusty sky, olive sage and
 * slate. Each stays distinct at a glance. Today's badge keeps ROLES.
 */
const BRAND_ROLES: Record<Role, string> = {
  General: "#4F9897",
  VIP: "#C79A4E",
  Speaker: "#6A8DB5",
  Staff: "#8FA36A",
  Supplier: "#56676B",
}

/** The attendee colour for a role, in today's set or the drafted brand's. */
function roleColorFor(role: Role, style: Style) {
  return style.art ? BRAND_ROLES[role] : ROLES.find((r) => r.id === role)!.color
}

/** A badge style: how the inner card looks, and the type it uses. */
export type Style = {
  id: string
  name: string
  blurb: string
  surface: string
  ink: string
  sub: string
  display: string
  accent: string
  pattern: Pattern
  /** Planned's own artwork behind the card: sky, clouds, paint, grain. */
  art?: Art
  /** Ink for the event header, when it sits on a different tone to the name. */
  headInk?: string
  /** A soft card behind the name and ID, like the panels on planned.com. */
  panel?: string
}

/** Planned's own look, before any AI style is applied. */
export const PLAIN: Style = {
  id: "plain",
  name: "Standard",
  blurb: "",
  surface: "#ffffff",
  ink: INK,
  sub: "#5c5c59",
  display: "'Inter Variable', Inter, sans-serif",
  accent: "#4B909A",
  pattern: "none",
}

/*
 * What the AI drafts for Planned's own event, having read planned.com: the
 * sunset skies and soft clouds behind its pages, its hand-painted teal
 * strokes, the fine grain over everything, its slate-teal ink (#21333A) and
 * its Geist type.
 */
const GEIST = "Geist, 'Inter Variable', Inter, sans-serif"
export const DRAFTS: Style[] = [
  {
    id: "golden",
    name: "Golden hour",
    blurb: "Hazy evening sky",
    surface: "linear-gradient(180deg, #9FB3B6 0%, #B3C2BE 18%, #CBD2BF 34%, #E6DDB2 52%, #EDD9AC 74%, #E8CFA4 100%)",
    ink: "#21333A",
    sub: "#3F4D4F",
    display: GEIST,
    accent: "#4F9897",
    pattern: "none",
    art: "sunset",
  },
  {
    id: "cloud",
    name: "Cloud cover",
    blurb: "Soft cloud, grainy sky",
    surface: "linear-gradient(180deg, #9C9F9D 0%, #A8AAA7 55%, #B1B2AE 100%)",
    ink: "#21333A",
    sub: "#4a5557",
    display: GEIST,
    accent: "#21333A",
    pattern: "none",
    art: "cloud",
  },
  {
    id: "brush",
    name: "Brushstroke",
    blurb: "Feathered mint paint",
    surface: "#E3E8E6",
    ink: "#21333A",
    sub: "#51605F",
    display: GEIST,
    accent: "#4F9897",
    pattern: "none",
    art: "paint",
  },
]

/** The palette pulled from planned.com. */
const BRAND = ["#4F9897", "#294B4F", "#21333A", "#E3C97A"]

/* ---------- Planned's artwork ---------- */

export type Art = "sunset" | "cloud" | "paint"

/** Heavy film grain, as laid over planned.com's skies, clouds and paint. */
const GRAIN =
  "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='180' height='180'><filter id='g'><feTurbulence type='fractalNoise' baseFrequency='1.1' numOctaves='2' stitchTiles='stitch'/><feColorMatrix type='saturate' values='0'/><feComponentTransfer><feFuncA type='linear' slope='0.9'/></feComponentTransfer></filter><rect width='100%' height='100%' filter='url(%23g)'/></svg>\")"

/**
 * A cumulus bank, built the way real cloud looks: an uneven ridge of towers
 * and dips, traced by many small billows of different sizes over a solid
 * body. Seeded, so it's the same cloud every time.
 */
const CLOUD = (() => {
  let seed = 7
  const rand = () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646
  // The ridge: a low base with a tall tower, a smaller one and a dip between.
  const towers = [
    [8, 52, 34],
    [72, 92, 38],
    [122, 46, 22],
    [178, 128, 42],
    [246, 70, 30],
  ]
  const ridge = (x: number) => 280 - towers.reduce((y, [c, a, w]) => y + a! * Math.exp(-(((x - c!) / w!) ** 2)), 0)
  const billows: [number, number, number][] = []
  for (let x = -24; x <= 284; x += 5 + rand() * 5) {
    const r = 7 + rand() * 15
    billows.push([x + (rand() - 0.5) * 4, ridge(x) + r * 0.7, r])
    // A second, larger row just inside the edge fills the body out.
    const r2 = 14 + rand() * 16
    billows.push([x + (rand() - 0.5) * 8, ridge(x) + r2 + 10, r2])
  }
  const body = `M-30 400 L-30 ${ridge(-30) + 20} ${Array.from({ length: 63 }, (_, k) => {
    const x = -30 + k * 5
    return `L${x} ${ridge(x) + 22}`
  }).join(" ")} L290 400 Z`
  return { billows, body, ridge }
})()


/**
 * The artwork behind a badge in Planned's visual language. Drawn on a
 * 260 × 380 canvas and cropped to fit, so it works at any badge size.
 */
export function BrandArt({ art, lower = 0 }: { art: Art; lower?: number }) {
  const id = useId().replace(/[^a-zA-Z0-9]/g, "")
  return (
    <span aria-hidden className="pointer-events-none absolute inset-0">
      <svg viewBox="0 0 260 380" preserveAspectRatio="xMidYMid slice" className="absolute inset-0 h-full w-full">
        <defs>
          {/* Cloud edge: broad lumps, then fine crinkle, then a soft blur. */}
          <filter id={`${id}c`} x="-20%" y="-20%" width="140%" height="140%">
            <feTurbulence type="fractalNoise" baseFrequency="0.018" numOctaves="2" seed="3" result="coarse" />
            <feDisplacementMap in="SourceGraphic" in2="coarse" scale="18" xChannelSelector="R" yChannelSelector="G" result="d1" />
            <feTurbulence type="fractalNoise" baseFrequency="0.11" numOctaves="2" seed="9" result="fine" />
            <feDisplacementMap in="d1" in2="fine" scale="6" xChannelSelector="R" yChannelSelector="G" result="d2" />
            <feGaussianBlur in="d2" stdDeviation="1.6" />
          </filter>
          {/* Wisps and inner shadows: very soft. */}
          <filter id={`${id}w`} x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="7" />
          </filter>
          {/* Lit from above: bright crowns, greyer bases. */}
          <linearGradient id={`${id}cg`} x1="0" y1="170" x2="0" y2="380" gradientUnits="userSpaceOnUse">
            <stop offset="0" stopColor="#F6F6F3" />
            <stop offset="0.45" stopColor="#ECECE8" />
            <stop offset="1" stopColor="#DEDFDB" />
          </linearGradient>
          {/* Feathered paint: a wavy edge, softly bled. */}
          <filter id={`${id}p`} x="-20%" y="-30%" width="140%" height="160%">
            <feTurbulence type="fractalNoise" baseFrequency="0.012 0.04" numOctaves="3" seed="4" result="n" />
            <feDisplacementMap in="SourceGraphic" in2="n" scale="22" xChannelSelector="R" yChannelSelector="G" result="d" />
            <feGaussianBlur in="d" stdDeviation="3.2" />
          </filter>
          <radialGradient id={`${id}sun`}>
            <stop offset="0" stopColor="#FFF4DA" stopOpacity="0.85" />
            <stop offset="0.4" stopColor="#FBE6BC" stopOpacity="0.35" />
            <stop offset="1" stopColor="#FBE6BC" stopOpacity="0" />
          </radialGradient>
          <radialGradient id={`${id}glow`} cx="0.5" cy="1" r="0.8">
            <stop offset="0" stopColor="#F3DDAE" stopOpacity="0.7" />
            <stop offset="1" stopColor="#F3DDAE" stopOpacity="0" />
          </radialGradient>
        </defs>
        {art === "sunset" && (
          /* Just the warm haze low in the sky; the gradient does the rest. */
          <>
            <rect x="0" y="180" width="260" height="200" fill={`url(#${id}glow)`} />
            <circle cx="196" cy="170" r="70" fill={`url(#${id}sun)`} />
            <circle cx="196" cy="170" r="15" fill="#FFF6E2" opacity="0.7" filter={`url(#${id}w)`} />
          </>
        )}
        {art === "cloud" && (
          <g transform={`translate(0 ${lower})`}>
            {/* A few thin wisps drifting above the bank. */}
            <g filter={`url(#${id}w)`} fill="#E9E9E6" opacity="0.55">
              <ellipse cx="60" cy="120" rx="46" ry="7" />
              <ellipse cx="200" cy="96" rx="38" ry="6" />
              <ellipse cx="150" cy="138" rx="28" ry="5" />
            </g>
            <g filter={`url(#${id}c)`} fill={`url(#${id}cg)`}>
              <path d={CLOUD.body} />
              {CLOUD.billows.map(([cx, cy, r], k) => (
                <circle key={k} cx={cx} cy={cy} r={r} />
              ))}
            </g>
            {/* Soft shadows where billows fold into each other. */}
            <g filter={`url(#${id}w)`} fill="#C9CAC6" opacity="0.45">
              <ellipse cx="118" cy={CLOUD.ridge(118) + 46} rx="26" ry="10" />
              <ellipse cx="40" cy={CLOUD.ridge(40) + 40} rx="22" ry="8" />
              <ellipse cx="216" cy={CLOUD.ridge(216) + 44} rx="24" ry="9" />
            </g>
          </g>
        )}
        {art === "paint" && (
          /* Three passes of translucent mint, each a little offset. */
          <g filter={`url(#${id}p)`}>
            <path d="M-40 210 C 40 196, 120 160, 190 130 C 230 114, 270 100, 310 92 L 310 190 C 250 200, 190 222, 120 250 C 60 274, 10 292, -40 300 Z" fill="#AFDBD0" opacity="0.95" />
            <path d="M-40 236 C 50 220, 130 186, 200 156 C 240 140, 280 128, 310 122 L 310 176 C 250 188, 190 212, 120 240 C 60 262, 10 276, -40 282 Z" fill="#9ED2C5" opacity="0.85" />
            <path d="M-40 258 C 60 244, 140 214, 210 186 C 250 170, 285 160, 310 156 L 310 184 C 250 196, 190 220, 120 246 C 60 266, 10 274, -40 276 Z" fill="#8FCABB" opacity="0.7" />
          </g>
        )}
      </svg>
      {/* Grain over the whole card, light and dark. */}
      <span className="absolute inset-0" style={{ backgroundImage: GRAIN, backgroundSize: "180px 180px", mixBlendMode: "soft-light", opacity: 0.95 }} />
      <span className="absolute inset-0" style={{ backgroundImage: GRAIN, backgroundSize: "180px 180px", mixBlendMode: "multiply", opacity: 0.12 }} />
    </span>
  )
}

/** Planned's mark: one continuous stroke that loops up and curls into a "p". */
export function PlannedLogo({ size = 20, color = "currentColor" }: { size?: number; color?: string }) {
  return (
    <svg viewBox="44 42 104 114" width={size} height={size * (114 / 104)} aria-label="Planned" role="img" className="shrink-0">
      <path
        d="M55 100 C 66 88, 76 72, 82 60 C 86 52, 96 51, 99 57 C 101 62, 98 70, 95 76 L 66 131 C 62 140, 66 146, 73 145 C 80 144, 86 135, 89 128 L 103 92 C 108 80, 120 76, 128 79 C 140 84, 140 108, 130 118 C 122 126, 112 129, 106 130"
        fill="none"
        stroke={color}
        strokeWidth="10"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

/* ---------- The badge ---------- */

function PatternLayer({ pattern, color }: { pattern: Pattern; color: string }) {
  if (pattern === "none") return null
  const style: React.CSSProperties =
    pattern === "dots"
      ? { backgroundImage: `radial-gradient(${color} 1.2px, transparent 1.4px)`, backgroundSize: "12px 12px", opacity: 0.35 }
      : pattern === "grid"
        ? {
            backgroundImage: `linear-gradient(${color} 1px, transparent 1px), linear-gradient(90deg, ${color} 1px, transparent 1px)`,
            backgroundSize: "18px 18px",
            opacity: 0.3,
          }
        : {}
  return (
    <span
      aria-hidden
      className="pointer-events-none absolute inset-x-0 top-[17%] h-[46%]"
      style={{
        WebkitMaskImage: "linear-gradient(transparent, #000 25%, #000 55%, transparent)",
        maskImage: "linear-gradient(transparent, #000 25%, #000 55%, transparent)",
      }}
    >
      {pattern === "waves" ? (
        <svg viewBox="0 0 200 80" preserveAspectRatio="none" className="h-full w-full" style={{ opacity: 0.5 }}>
          {[18, 32, 46, 60].map((y, i) => (
            <path
              key={y}
              d={`M0 ${y} C 25 ${y - 9}, 50 ${y + 9}, 75 ${y} S 125 ${y - 9}, 150 ${y} S 185 ${y + 6}, 200 ${y}`}
              fill="none"
              stroke={color}
              strokeWidth={1.4 - i * 0.2}
            />
          ))}
        </svg>
      ) : (
        <span className="absolute inset-0" style={style} />
      )}
    </span>
  )
}

/** A lighter tint of a colour, mixed toward Planned's warm cream. */
function tint(hex: string, amount: number) {
  const c = (i: number) => parseInt(hex.slice(i, i + 2), 16)
  const cream = [252, 251, 244]
  return `rgb(${[1, 3, 5].map((i, k) => Math.round(c(i) + (cream[k]! - c(i)) * amount)).join(",")})`
}

/** The badge's code, drawn like a QR code: three finder squares and seeded modules. */
const CODE = (() => {
  let seed = 11
  const rand = () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646
  const n = 21
  const finder = (x: number, y: number) => (x < 7 && y < 7) || (x >= n - 7 && y < 7) || (x < 7 && y >= n - 7)
  const cells: [number, number][] = []
  for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) if (!finder(x, y) && rand() > 0.52) cells.push([x, y])
  return { n, cells }
})()

function CheckInCode({ size, color }: { size: number; color: string }) {
  const f = (x: number, y: number) => (
    <g key={`${x}${y}`}>
      <rect x={x + 0.5} y={y + 0.5} width="6" height="6" rx="1.4" fill="none" stroke={color} strokeWidth="1" />
      <rect x={x + 2} y={y + 2} width="3" height="3" rx="0.7" fill={color} />
    </g>
  )
  return (
    <svg viewBox={`0 0 ${CODE.n} ${CODE.n}`} width={size} height={size} aria-hidden>
      {f(0, 0)}
      {f(CODE.n - 7, 0)}
      {f(0, CODE.n - 7)}
      {CODE.cells.map(([x, y]) => (
        <rect key={`${x}-${y}`} x={x + 0.1} y={y + 0.1} width="0.8" height="0.8" rx="0.25" fill={color} />
      ))}
    </svg>
  )
}

/**
 * The face of an AI-drafted badge: the same content as today's, set with more
 * care. Editorial type with the name stacked large, a soft glass label for the
 * attendee type, a hairline above the footer, and the badge's code.
 */
function StyledFace({
  style,
  role,
  portrait,
  big,
  showName,
  showCompany,
  highlightCode = false,
  showCode = true,
  band = false,
  bandColor = "#4F9897",
}: {
  link?: string
  highlightCode?: boolean
  showCode?: boolean
  /** The Top band template: a solid band of the attendee colour across the top. */
  band?: boolean
  bandColor?: string
  style: Style
  role: Role
  portrait: boolean
  big: boolean
  showName: boolean
  showCompany: boolean
}) {
  // The band is the frame's own soft tint, so the header stays in dark ink on it.
  const head = band ? style.ink : style.headInk ?? style.ink
  // Dates and city also in ink on the band, so they pass contrast on every attendee colour.
  const metaColor = band ? style.ink : style.headInk ? head : style.sub
  // Big type: the name set noticeably larger.
  const nameSize = big ? (portrait ? 56 : 46) : portrait ? 42 : 34
  const bandLayer = band && (
    <span
      aria-hidden
      className="absolute inset-x-0 top-0"
      style={{
        height: portrait ? 118 : 76,
        // The same soft tint and direction as the badge's frame, so they read as one piece.
        background: `linear-gradient(160deg, ${tint(bandColor, 0.62)}, ${tint(bandColor, 0.48)})`,
        boxShadow: "inset 0 -1px 0 rgba(255,255,255,0.35)",
      }}
    />
  )
  const pill = (
    <span
      className="inline-flex items-center rounded-full px-2.5 py-[3px] text-[9px] font-semibold tracking-[0.1em] uppercase"
      style={{
        color: style.ink,
        background: "rgba(255,255,255,0.5)",
        boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.65), 0 1px 2px rgba(33,51,58,0.06)",
        backdropFilter: "blur(6px)",
        WebkitBackdropFilter: "blur(6px)",
      }}
    >
      {role}
    </span>
  )
  // Landscape: the same footer as portrait (a hairline, the ID and the code),
  // with a compact header beside the logo so everything fits the short card.
  if (!portrait) {
    return (
      <div className="relative flex h-full flex-col px-[22px] pt-[22px] pb-[16px]">
        {bandLayer}
        <div className="relative flex items-center gap-2.5" style={{ color: head }}>
          <PlannedLogo size={20} />
          <div className="leading-tight">
            <div className="text-[13px] font-semibold tracking-[-0.01em]">Planned Live</div>
            <div className="mt-[2px] text-[9.5px] whitespace-nowrap tabular-nums" style={{ color: metaColor }}>
              2026-10-06 – 2026-10-08 · San Francisco
            </div>
          </div>
        </div>
        <div className="mt-auto">
          {pill}
          {showName && (
            <div
              className="mt-2 font-semibold tracking-[-0.035em] whitespace-nowrap transition-[font-size] duration-500"
              style={{ fontFamily: style.display, fontSize: nameSize, lineHeight: 0.98 }}
            >
              Jane Smith
            </div>
          )}
          {showCompany && (
            <div className="mt-1.5 text-[11.5px] leading-snug" style={{ color: style.sub }}>
              Head of Events · Northwind Financial
            </div>
          )}
        </div>
        <div className="mt-3 flex items-stretch justify-between gap-3 border-t pt-2.5" style={{ borderColor: `${style.ink}1f` }}>
          <div className="flex min-h-[36px] flex-col justify-between py-[3px]">
            <div className="text-[7.5px] leading-none font-medium tracking-[0.16em] whitespace-nowrap uppercase" style={{ color: style.sub }}>
              Attendee ID
            </div>
            <div className="text-[12px] leading-none font-semibold tracking-[0.02em] tabular-nums">EVNT256</div>
          </div>
          {showCode && (
            <span className={`view-in rounded-[6px] p-[3px] ${highlightCode ? "code-pulse" : ""}`} style={{ background: "rgba(255,255,255,0.78)", boxShadow: highlightCode ? undefined : "0 1px 2px rgba(33,51,58,0.08)" }}>
              <CheckInCode size={30} color="#21333A" />
            </span>
          )}
        </div>
      </div>
    )
  }
  return (
    <div className="relative flex h-full flex-col px-[20px] pt-[28px] pb-[16px]">
      {bandLayer}
      {/* The event: Planned's mark, the name, the dates. */}
      {/* The event: Planned's mark, then the name, dates and city, each on its own line. */}
      <div className="relative" style={{ color: head }}>
        <PlannedLogo size={20} />
        <div className="mt-2.5 text-[13px] leading-tight font-semibold tracking-[-0.01em]">Planned Live</div>
        <div className="mt-[3px] text-[9.5px] leading-[1.45] whitespace-nowrap tabular-nums" style={{ color: metaColor }}>
          <div>2026-10-06 – 2026-10-08</div>
          <div>San Francisco</div>
        </div>
      </div>

      <div className="mt-auto">
        {/* The attendee type, on soft frosted glass. */}
        <span
          className="inline-flex items-center rounded-full px-2.5 py-[3px] text-[9px] font-semibold tracking-[0.1em] uppercase"
          style={{
            color: style.ink,
            background: "rgba(255,255,255,0.5)",
            boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.65), 0 1px 2px rgba(33,51,58,0.06)",
            backdropFilter: "blur(6px)",
            WebkitBackdropFilter: "blur(6px)",
          }}
        >
          {role}
        </span>
        {showName && (
          <div
            className="mt-2.5 font-semibold tracking-[-0.035em] transition-[font-size] duration-500"
            style={{ fontFamily: style.display, fontSize: nameSize, lineHeight: 0.94 }}
          >
            Jane
            {portrait ? <br /> : " "}
            Smith
          </div>
        )}
        {showCompany && (
          <div className="mt-2 text-[11.5px] leading-snug" style={{ color: style.sub }}>
            Head of Events · Northwind Financial
          </div>
        )}
      </div>

      {/* Footer: a hairline, the ID and the badge's code. */}
      {/* Footer: the ID's label and number line up with the code's top and
          bottom edges. */}
      <div className="mt-4 flex items-stretch justify-between gap-3 border-t pt-2.5" style={{ borderColor: `${style.ink}1f` }}>
        <div className="flex min-h-[36px] flex-col justify-between py-[3px]">
          <div className="text-[7.5px] leading-none font-medium tracking-[0.16em] whitespace-nowrap uppercase" style={{ color: style.sub }}>
            Attendee ID
          </div>
          <div className="text-[12px] leading-none font-semibold tracking-[0.02em] tabular-nums">EVNT256</div>
        </div>
        <div className="flex items-stretch gap-2">
          {showCode && <span className={`view-in rounded-[6px] p-[3px] ${highlightCode ? "code-pulse" : ""}`} style={{ background: "rgba(255,255,255,0.78)", boxShadow: highlightCode ? undefined : "0 1px 2px rgba(33,51,58,0.08)" }}>
            <CheckInCode size={30} color="#21333A" />
          </span>}
        </div>
      </div>
    </div>
  )
}

/**
 * Cuts a real, see-through slot into a card: a rounded hole of the given size,
 * centred, a set distance from the top. Everything under the mask (the card,
 * its art, its frame) gets the same hole, so the page shows through it.
 */
export function slotMask(w: number, h: number, top: number): React.CSSProperties {
  const hole = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='${w}' height='${h}'%3E%3Crect width='${w}' height='${h}' rx='${h / 2}'/%3E%3C/svg%3E")`
  const all = "linear-gradient(#000, #000)"
  return {
    WebkitMaskImage: `${hole}, ${all}`,
    maskImage: `${hole}, ${all}`,
    WebkitMaskSize: `${w}px ${h}px, 100% 100%`,
    maskSize: `${w}px ${h}px, 100% 100%`,
    WebkitMaskPosition: `center ${top}px, 0 0`,
    maskPosition: `center ${top}px, 0 0`,
    WebkitMaskRepeat: "no-repeat",
    maskRepeat: "no-repeat",
    WebkitMaskComposite: "xor",
    maskComposite: "exclude",
  }
}

/** The cut edge of a slot: a faint rim, drawn over the hole without filling it. */
export function SlotRim({ w, h, top }: { w: number; h: number; top: number }) {
  return (
    <span
      aria-hidden
      className="pointer-events-none absolute left-1/2 z-[3] -translate-x-1/2 rounded-full"
      style={{ top, width: w, height: h, boxShadow: "inset 0 1px 1.5px rgba(0,0,0,0.28), 0 1px 0 rgba(255,255,255,0.5)" }}
    />
  )
}

export function Badge({
  size,
  template,
  role,
  style,
  accent,
  pattern,
  showName,
  showCompany,
  loading = false,
  link,
  highlightCode = false,
  showCode = true,
  cut,
  roleColorOverride,
}: {
  /** A colour the organiser set for this attendee type, if any. */
  roleColorOverride?: string
  /** A real, see-through slot (the new version). Today's badge keeps its own. */
  cut?: boolean
  /** Whether the badge carries a code at all. */
  showCode?: boolean
  /** Picks out the code with a soft pulsing ring, for figures. */
  highlightCode?: boolean
  loading?: boolean
  /** Where the badge's code takes anyone who scans it with a phone. */
  link?: string
  size: Size
  template: Template
  role: Role
  style: Style
  accent: string
  pattern: Pattern
  showName: boolean
  showCompany: boolean
}) {
  const roleColor = roleColorOverride ?? roleColorFor(role, style)
  const portrait = size === "portrait"
  const big = template === "big"
  const slot = cut ?? !!style.art
  return (
    <div
      className="relative rounded-[22px] shadow-[0_24px_50px_-24px_rgba(15,15,15,0.35)] transition-[width,height] duration-500"
      style={{ width: portrait ? 280 : 400, height: portrait ? 400 : 280 }}
    >
      {/* The frame and card, with a real slot punched through both. */}
      <div
        className="absolute inset-0 rounded-[22px] p-[10px]"
        style={{
          background: style.art ? `linear-gradient(160deg, ${tint(roleColor, 0.62)}, ${tint(roleColor, 0.48)})` : roleColor,
          boxShadow: style.art ? "inset 0 1px 0 rgba(255,255,255,0.55), inset 0 0 0 1px rgba(255,255,255,0.18)" : undefined,
          ...(slot ? slotMask(40, 10, 12) : {}),
        }}
      >
      {/* Today's badge: its slot, drawn as it was. */}
      {!slot && (
        <span
          className="absolute top-[12px] left-1/2 z-[2] h-[10px] w-[40px] -translate-x-1/2 rounded-full"
          style={{ background: "#eef0ee", boxShadow: "inset 0 2px 3px rgba(0,0,0,0.35), 0 1px 0 rgba(255,255,255,0.35)" }}
        />
      )}
      <div
        className="relative h-full overflow-hidden rounded-[14px] transition-[background] duration-500"
        style={{ background: style.surface, color: style.ink }}
      >
        {style.art && <BrandArt art={style.art} />}
        <PatternLayer pattern={pattern} color={accent} />
        {/* While a style is being drafted, a light sweeps across the card. */}
        {loading && <span aria-hidden className="badge-shimmer pointer-events-none absolute inset-0 z-10" />}
        {template === "band" && !style.art && <span className="absolute inset-x-0 top-0 h-[68px]" style={{ background: accent }} />}
        {/* A fine light edge around the printed face. */}
        {style.art && <span aria-hidden className="pointer-events-none absolute inset-0 z-[1] rounded-[14px]" style={{ boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.45), inset 0 1px 0 rgba(255,255,255,0.6)" }} />}
        {style.art ? (
          <StyledFace style={style} role={role} portrait={portrait} big={big} showName={showName} showCompany={showCompany} link={link} highlightCode={highlightCode} showCode={showCode} band={template === "band"} bandColor={roleColor} />
        ) : (
        <div className="relative flex h-full flex-col px-[20px] pt-[30px] pb-[18px]">
          {/* The event's brand, now part of every badge. */}
          <div className="flex items-center gap-2" style={{ color: template === "band" ? "#fff" : (style.headInk ?? style.ink) }}>
            {style.art ? (
              <PlannedLogo size={19} />
            ) : (
              <span className="flex size-[22px] items-center justify-center rounded-[6px]" style={{ background: template === "band" ? "rgba(255,255,255,0.22)" : accent }}>
                <span className="block h-[8px] w-[12px] rounded-t-full" style={{ background: "#fff" }} />
              </span>
            )}
            <div className="leading-tight">
              <div className="text-[10.5px] font-bold tracking-[0.12em] uppercase">Planned Live</div>
              <div className="text-[8.5px] opacity-75">2026-10-06 – 2026-10-08 · San Francisco</div>
            </div>
          </div>
          <div
            className={style.panel ? `-mx-[8px] -mb-[8px] flex flex-col rounded-[12px] px-[14px] pt-[12px] pb-[12px] ${portrait ? "mt-auto" : "mt-auto"}` : "contents"}
            style={style.panel ? { background: style.panel, backdropFilter: "blur(6px)", WebkitBackdropFilter: "blur(6px)", boxShadow: "inset 0 0 0 1px rgba(252,251,244,0.35)" } : undefined}
          >
          <div className={style.panel ? "" : portrait ? "mt-auto" : template === "band" ? "mt-[30px]" : "mt-[18px]"}>
            <span
              className="inline-flex items-center gap-1.5 rounded-full px-2 py-[3px] text-[10px] font-semibold"
              style={{ background: `${roleColor}22`, color: style.ink }}
            >
              {/* Today's badge keeps its dot; the AI styles drop it. */}
              {!style.art && <span className="size-[6px] rounded-full" style={{ background: roleColor }} />}
              {role}
            </span>
            {showName && (
              <div
                className="mt-2 leading-[1.02] font-semibold tracking-[-0.02em] transition-[font-size] duration-500"
                style={{ fontFamily: style.display, fontSize: big ? (portrait ? 46 : 42) : portrait ? 34 : 32 }}
              >
                Jane Smith
              </div>
            )}
            {showCompany && (
              <div className="mt-1.5 text-[12px] leading-snug" style={{ color: style.sub }}>
                Head of Events, Northwind Financial
              </div>
            )}
          </div>
          <div className={`flex items-end justify-between ${style.panel ? "mt-4" : portrait ? "mt-5" : "mt-auto"}`}>
            <div>
              <div className="text-[8.5px] tracking-[0.1em] uppercase" style={{ color: style.sub }}>
                ID
              </div>
              <div className="text-[13px] font-semibold tabular-nums">EVNT256</div>
            </div>
            <span className="h-[3px] w-[44px] rounded-full" style={{ background: accent }} />
          </div>
          </div>
        </div>
        )}
      </div>
      </div>
      {slot && <SlotRim w={40} h={10} top={12} />}
    </div>
  )
}

/**
 * The lanyard's metal: D-ring, swivel and a clip whose hook passes through the
 * badge's slot. Drawn on a 60 × 92 canvas. The hook's front strand comes down
 * in front of the card into the slot; its back strand goes behind the card, so
 * it's hidden below the card's top edge except where it shows through the slot.
 */
export function LanyardClip({
  className,
  cardTop,
  slot,
}: {
  className?: string
  /** Where the card's top edge falls, in the clip's 60 × 92 units. */
  cardTop: number
  /** The slot, in the same units. */
  slot: { x: number; y: number; w: number; h: number }
}) {
  const id = useId().replace(/[^a-zA-Z0-9]/g, "")
  return (
    <svg viewBox="0 0 60 92" className={className} aria-hidden>
      <defs>
        <linearGradient id={`${id}m`} x1="0" x2="1" y1="0" y2="0">
          <stop offset="0" stopColor="#7d8285" />
          <stop offset="0.35" stopColor="#f4f6f7" />
          <stop offset="0.6" stopColor="#a9aeb1" />
          <stop offset="1" stopColor="#5f6467" />
        </linearGradient>
        {/* Visible: everything above the card, the front strand, and the slot. */}
        <mask id={`${id}k`} maskUnits="userSpaceOnUse" x="0" y="0" width="60" height="92">
          <rect x="0" y="0" width="60" height={cardTop} fill="#fff" />
          <rect x="0" y="0" width="30.5" height="92" fill="#fff" />
          <rect x={slot.x} y={slot.y} width={slot.w} height={slot.h} rx={slot.h / 2} fill="#fff" />
        </mask>
      </defs>
      <path d="M12 4 H48 A10 10 0 0 1 48 24 H12 A10 10 0 0 1 12 4 Z" fill="none" stroke={`url(#${id}m)`} strokeWidth="4.5" />
      <rect x="25" y="24" width="10" height="14" rx="3" fill={`url(#${id}m)`} />
      <g mask={`url(#${id}k)`}>
        <path d="M30 38 C 17 44, 16 68, 26 84 C 29 89, 33 89, 35 84 C 44 68, 43 46, 30 38 Z" fill="none" stroke={`url(#${id}m)`} strokeWidth="4" />
      </g>
      <path d="M37 52 L 41 46" stroke={`url(#${id}m)`} strokeWidth="3" strokeLinecap="round" />
    </svg>
  )
}

/** The lanyard above a badge: a woven strap, a metal D-ring, swivel and clip. */
export function Lanyard({ strap = 70, grow = false }: { strap?: number; grow?: boolean }) {
  return (
    <>
      <span
        className={`relative block w-[54px] ${grow ? "min-h-[40px] flex-1" : ""}`}
        style={{
          height: grow ? undefined : strap,
          background:
            "linear-gradient(90deg, rgba(0,0,0,0.35), rgba(255,255,255,0.06) 30%, rgba(255,255,255,0.03) 70%, rgba(0,0,0,0.4)), repeating-linear-gradient(135deg, #1a1a1a 0 2.5px, #262626 2.5px 5px)",
          clipPath: "polygon(0 0, 100% 0, 100% 84%, 74% 100%, 26% 100%, 0 84%)",
        }}
      />
      <LanyardClip className="relative z-10 -mt-[6px] h-[80px] w-[52px]" cardTop={66.9} slot={{ x: 7, y: 80.7, w: 46, h: 11.5 }} />
    </>
  )
}

/**
 * The preview badge, as it would be worn: hung on a lanyard, dropped in once,
 * swaying gently, and tilting in 3D toward the pointer, with a sheen that
 * moves as it turns and some thickness at its edge.
 */
function HangingBadge(props: React.ComponentProps<typeof Badge>) {
  const ref = useRef<HTMLDivElement>(null)
  const onMove = (e: React.PointerEvent) => {
    const el = ref.current
    if (!el) return
    const r = el.getBoundingClientRect()
    const x = (e.clientX - (r.left + r.width / 2)) / (r.width / 2)
    const y = (e.clientY - (r.top + r.height / 2)) / (r.height / 2)
    const clamp = (v: number) => Math.max(-1, Math.min(1, v))
    el.style.setProperty("--ry", `${clamp(x) * 16}deg`)
    el.style.setProperty("--rx", `${-clamp(y) * 9}deg`)
    el.style.setProperty("--sheen", `${50 - clamp(x) * 40}%`)
  }
  const onLeave = () => {
    const el = ref.current
    if (!el) return
    el.style.setProperty("--ry", "0deg")
    el.style.setProperty("--rx", "0deg")
    el.style.setProperty("--sheen", "50%")
  }
  return (
    <div
      ref={ref}
      onPointerMove={onMove}
      onPointerLeave={onLeave}
      className="hang-drop flex h-full w-full flex-col items-center"
      style={{ perspective: 1100 }}
    >
      {/* The strap fills the space above the card, and an equal space sits
          below it (plus the clip's height), so the card itself is centred. */}
      <Lanyard grow />
      {/* High enough that the clip's loop hangs down into the slot. */}
      <div className="hang-sway -mt-[22px] flex flex-col items-center" style={{ transformOrigin: "50% 0" }}>
        <div
          className="relative transition-transform duration-300 ease-out"
          style={{ transform: "rotateX(var(--rx, 0deg)) rotateY(var(--ry, 0deg))", transformStyle: "preserve-3d" }}
        >
          {/* The card's thickness, just behind its face. */}
          <span
            aria-hidden
            className="absolute inset-0 rounded-[22px]"
            style={{ transform: "translateZ(-4px)", background: "#9aa3a1", filter: "brightness(0.8)", ...slotMask(40, 10, 12) }}
          />
          <Badge {...props} cut />
          {/* A soft sheen that slides as the card turns. */}
          <span
            aria-hidden
            className="pointer-events-none absolute inset-0 rounded-[22px] transition-[background-position] duration-300"
            style={{
              background: "linear-gradient(115deg, rgba(255,255,255,0) 35%, rgba(255,255,255,0.22) 50%, rgba(255,255,255,0) 65%)",
              backgroundSize: "300% 100%",
              backgroundPosition: "var(--sheen, 50%) 0",
              mixBlendMode: "screen",
              ...slotMask(40, 10, 12),
            }}
          />
        </div>
      </div>
      <div className="min-h-[40px] flex-1" />
      <div className="h-[62px] shrink-0" />
    </div>
  )
}

/* ---------- Small pieces of Planned's UI ---------- */

/**
 * Planned's own AI mark: a large and a small four-point sparkle in a soft
 * pink-to-lilac gradient, as used across Planned's interface ("Recommended",
 * AI suggestions). Used wherever the agent shows up.
 */
export function AiLabel({ size: base = 14 }: { size?: number }) {
  const id = useId().replace(/[^a-zA-Z0-9]/g, "")
  // Drawn a touch larger than the nominal size, to read clearly at small sizes.
  const size = Math.round(base * 1.2)
  return (
    <svg role="img" aria-label="AI" width={size} height={size} viewBox="0 0 24 24" className="inline-block shrink-0">
      <title>AI</title>
      <defs>
        <linearGradient id={`${id}ai`} x1="2" y1="2" x2="22" y2="22" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#F37BAA" />
          <stop offset="1" stopColor="#B585E0" />
        </linearGradient>
      </defs>
      <path
        d="M10 4C10.6 9.4 12.6 11.4 18 12C12.6 12.6 10.6 14.6 10 20C9.4 14.6 7.4 12.6 2 12C7.4 11.4 9.4 9.4 10 4Z"
        fill={`url(#${id}ai)`}
      />
      <path
        d="M18.6 1.8C18.85 4.1 19.8 5.05 22.1 5.3C19.8 5.55 18.85 6.5 18.6 8.8C18.35 6.5 17.4 5.55 15.1 5.3C17.4 5.05 18.35 4.1 18.6 1.8Z"
        fill={`url(#${id}ai)`}
      />
    </svg>
  )
}

function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`field-card rounded-[12px] border bg-white ${className}`} style={{ borderColor: LINE }}>
      {children}
    </div>
  )
}

function Radio({ on }: { on: boolean }) {
  return (
    <span
      className="flex size-[16px] shrink-0 items-center justify-center rounded-full border-[1.5px]"
      style={{ borderColor: on ? SELECT : "#cfcfcb" }}
    >
      {on && <span className="size-[7px] rounded-full" style={{ background: SELECT }} />}
    </span>
  )
}

/** What each kind of added context is called in the prototype. */
const EXTRA_NAMES = {
  link: ["planned.com/live/speakers", "planned.com/live/venue", "Sponsor site"],
  images: ["Venue photos (8)", "Speaker headshots (12)", "Last year's event (24)"],
  file: ["Brand guidelines.pdf", "Sponsor logos.pdf", "Signage spec.pdf"],
} as const
type ExtraKind = keyof typeof EXTRA_NAMES
type Extra = { id: string; kind: ExtraKind; name: string; fresh: boolean }

/** A small × for taking a source out of the list. */
function RemoveButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      aria-label={label}
      title="Remove"
      onClick={onClick}
      className="flex size-[24px] shrink-0 items-center justify-center rounded-[7px] transition-colors hover:bg-[#f1f1ee]"
      style={{ color: MUTED }}
    >
      <X className="size-[13px]" strokeWidth={1.8} />
    </button>
  )
}

/** A compact on/off switch, for the source list. */
function MiniSwitch({ on, onClick, label }: { on: boolean; onClick: () => void; label: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={label}
      onClick={onClick}
      className="relative h-[18px] w-[30px] shrink-0 rounded-full transition-colors"
      style={{ background: on ? SWITCH : "#e2e2df" }}
    >
      <span className="absolute top-[2px] size-[14px] rounded-full bg-white shadow transition-[left]" style={{ left: on ? 14 : 2 }} />
    </button>
  )
}

function Toggle({ on, onClick, label }: { on: boolean; onClick: () => void; label: string }) {
  return (
    <button type="button" onClick={onClick} className="flex items-center gap-3 text-[13.5px]">
      <span
        className="relative h-[20px] w-[34px] rounded-full transition-colors"
        style={{ background: on ? SWITCH : "#e2e2df" }}
      >
        <span
          className="absolute top-[2px] size-[16px] rounded-full bg-white shadow transition-[left]"
          style={{ left: on ? 16 : 2 }}
        />
      </span>
      {label}
    </button>
  )
}

/** A tiny badge, for the template and style cards. */
function MiniBadge({ style, band, big, window: win }: { style?: Style; band?: boolean; big?: boolean; window?: boolean }) {
  const s = style ?? PLAIN
  return (
    <span
      className="relative block h-[58px] w-[42px] overflow-hidden rounded-[5px] border shadow-[0_2px_6px_rgba(15,15,15,0.08)]"
      style={{ background: s.surface, borderColor: "var(--line, #e3e3e0)" }}
    >
      {s.art && <BrandArt art={s.art} />}
      <PatternLayer pattern={s.pattern} color={s.accent} />
      {/* Print window: the pre-printed colour shows through a window at the top. */}
      {win && <span className="absolute inset-x-[4px] top-[4px] h-[8px] rounded-[2px]" style={{ background: "#4B909A" }} />}
      {band && <span className="absolute inset-x-0 top-0 h-[12px]" style={{ background: "#4B909A" }} />}
      {big && <span className="absolute inset-x-0 bottom-0 h-[12px]" style={{ background: "#4B909A" }} />}
      <span className="absolute top-[18px] left-[6px] h-[3px] w-[18px] rounded-full" style={{ background: s.ink, opacity: 0.85 }} />
      <span className="absolute top-[24px] left-[6px] h-[2px] w-[12px] rounded-full" style={{ background: s.ink, opacity: 0.4 }} />
      {style && <span className="absolute bottom-[6px] left-[6px] h-[2px] w-[14px] rounded-full" style={{ background: s.accent }} />}
    </span>
  )
}

/**
 * The printed badges, ready to review right under the preview: the stock the
 * style is pre-printed on, sized from the guest list with spares for walk-ins.
 */
function OrderCard({ styleName, size }: { styleName?: string; size: Size }) {
  const guests = 248
  const total = Math.ceil((guests * 1.3) / 10) * 10
  return (
    // One slim row, so it sits under the badge without covering it.
    <div
      className="absolute inset-x-3 bottom-3 z-20 flex items-center gap-3 rounded-[14px] border bg-white/90 py-3 pr-3 pl-3 shadow-[0_8px_24px_-14px_rgba(15,15,15,0.25)] backdrop-blur-md"
      style={{ borderColor: LINE }}
      title={`${size === "portrait" ? "4 × 6 in" : "6 × 4 in"}, pre-printed on matte stock. ${guests} guests plus 30% spare for walk-ins.`}
    >
      <span className="flex size-[34px] shrink-0 items-center justify-center rounded-[9px]" style={{ background: "var(--chip, #f1f1ee)" }}>
        <Printer className="size-[16px]" strokeWidth={1.7} />
      </span>
      <div className="min-w-0 flex-1 leading-tight">
        <div className="truncate text-[13.5px] font-medium">
          {total} badges{styleName ? ` · ${styleName}` : ""}
        </div>
        <div className="mt-0.5 text-[12px] tabular-nums" style={{ color: MUTED }}>
          Estimated delivery 2026-09-29
        </div>
      </div>
      {/* The next step is a review (price, delivery address, quantity),
          not a purchase; nothing is ordered from this one click. */}
      <button
        type="button"
        title="Review price, delivery address and quantity"
        className="shrink-0 rounded-[8px] px-3 py-1.5 text-[12.5px] font-medium text-white"
        style={{ background: "#1d1d1b" }}
      >
        Review order
      </button>
    </div>
  )
}

/* ---------- The page ---------- */

const NAV: [React.ComponentType<{ className?: string; strokeWidth?: number }>, string][] = [
  [Home, "Overview"],
  [Box, "Event hub"],
  [Globe, "Website"],
  [Ticket, "Registration"],
  [Users, "Attendees"],
  [BedDouble, "Room blocks"],
  [CalendarDays, "Agenda"],
  [Mail, "Campaigns"],
  [ClipboardList, "Survey"],
  [BarChart3, "Insights"],
]

/**
 * Planned's current sidebar, for the new version: the mark and two tools up
 * top, an event switcher, then grouped sections, with an avatar and Inbox at
 * the foot. It sits on the page's soft grey, beside a white content panel.
 */
type NavIcon = React.ComponentType<{ className?: string; strokeWidth?: number }>
const NEW_NAV: { heading?: string; items: [NavIcon, string][] }[] = [
  { items: [[House, "Overview"], [MessageSquare, "Chat"]] },
  {
    heading: "Sourcing",
    items: [[FileText, "Event brief"], [Store, "Marketplace"], [UsersRound, "Suppliers"], [Columns3, "Proposal"], [FilePenLine, "Contracts"], [Receipt, "Payments"]],
  },
  { heading: "Planner tools", items: [[MapPinned, "Where to meet"], [ListChecks, "Checklist"], [CalendarDays, "Agenda"]] },
  { heading: "Attendee management", items: [[LayoutGrid, "Dashboard"], [Users, "Attendees"], [Mails, "Invites & reminders"]] },
  { heading: "Configurations", items: [[Palette, "Branding"], [Globe, "Event site"]] },
]

function NewNav() {
  // The list scrolls; it opens scrolled to the current page, Attendees.
  const navRef = useRef<HTMLElement>(null)
  useEffect(() => {
    const nav = navRef.current
    const on = nav?.querySelector<HTMLElement>("[data-current]")
    if (nav && on) nav.scrollTop = Math.max(0, on.offsetTop - nav.clientHeight / 2)
  }, [])
  return (
    <aside className="flex w-[248px] shrink-0 flex-col py-4 pr-3 pl-4">
      <div className="flex items-center justify-between px-1.5">
        <PlannedLogo size={20} />
        <span className="flex items-center gap-3 text-[#5d5d5a]">
          <LayoutGrid className="size-[16px]" strokeWidth={1.7} />
          <PanelLeft className="size-[16px]" strokeWidth={1.7} />
        </span>
      </div>
      {/* The event switcher. */}
      <div className="mt-5 flex items-center gap-2.5 px-1.5">
        <span className="size-[24px] shrink-0 rounded-[6px]" style={{ background: "linear-gradient(140deg, #2F5A7E, #5B95C4 60%, #9CC6E0)" }} />
        <span className="min-w-0 flex-1 truncate text-[14px] font-medium">Planned Live</span>
        <ChevronDown className="size-[15px] text-[#8a8a87]" strokeWidth={1.8} />
      </div>
      <nav ref={navRef} className="no-scrollbar relative mt-4 flex min-h-0 flex-1 flex-col overflow-y-auto">
        {NEW_NAV.map((group, g) => (
          <div key={g} className={g > 0 ? "mt-2 border-t pt-3" : ""} style={g > 0 ? { borderColor: "#E9EBEE" } : undefined}>
            {group.heading && (
              <div className="mb-1 px-2.5 text-[12px]" style={{ color: "#8a8a87" }}>
                {group.heading}
              </div>
            )}
            <div className="flex flex-col gap-px">
              {group.items.map(([Icon, label]) => {
                // Badges lives within Attendees, so that's the current page.
                const on = label === "Attendees"
                return (
                  <span
                    key={label}
                    data-current={on || undefined}
                    className="flex shrink-0 items-center gap-3 rounded-[10px] px-2.5 py-[7px] text-[14px]"
                    style={on ? { background: "#fff", boxShadow: "0 1px 2px rgba(15,15,15,0.06)", color: INK } : { color: "#3f3f3c" }}
                  >
                    <Icon className="size-[16px] text-[#5d5d5a]" strokeWidth={1.7} />
                    {label}
                  </span>
                )
              })}
            </div>
          </div>
        ))}
      </nav>
      {/* The person, and the inbox. */}
      <div className="mt-3 flex items-center gap-2.5 border-t pt-3" style={{ borderColor: "#E9EBEE" }}>
        <span className="flex size-[30px] shrink-0 items-center justify-center rounded-full text-[12px] font-medium" style={{ background: "#F6E3DE", color: "#9a5a4a" }}>
          J
        </span>
        <span className="relative flex flex-1 items-center justify-center gap-2 rounded-full bg-white py-[7px] text-[13.5px] shadow-[0_1px_2px_rgba(15,15,15,0.06)]">
          <span className="relative">
            <Inbox className="size-[15px]" strokeWidth={1.7} />
            <span className="absolute -top-[3px] -right-[3px] size-[7px] rounded-full ring-2 ring-white" style={{ background: "#E5484D" }} />
          </span>
          Inbox
        </span>
      </div>
    </aside>
  )
}

export function PlannedBadge({
  embedded = false,
  ai = true,
  known: knownAtStart = true,
}: {
  /** false starts with nothing to go on: no website, brand or photos yet. */
  known?: boolean
  /** Shown inside a case study: always the desktop layout, no full-screen height. */
  embedded?: boolean
  /** false shows the page as it is today, without the AI card. */
  ai?: boolean
} = {}) {
  const [size, setSize] = useState<Size>("portrait")
  const [template, setTemplate] = useState<Template>("window")
  const [role, setRole] = useState<Role>("General")
  const [showName, setShowName] = useState(true)
  const [showCompany, setShowCompany] = useState(true)
  // The badge's code can also open a page of the
  // organiser's choosing for anyone who scans it with a phone.
  const [codeLink, setCodeLink] = useState(true)
  const [codeUrl, setCodeUrl] = useState("planned.com/live/agenda")
  // Colours the organiser picked for attendee types, over the defaults.
  const [custom, setCustom] = useState<Partial<Record<Role, string>>>({})
  const colorFor = (r: Role) => custom[r] ?? roleColorFor(r, style)
  const [hexDraft, setHexDraft] = useState<string | null>(null)
  // The code goes through a Planned link, so its destination can change after
  // printing: the agenda during the event, and (suggested by the agent) the
  // feedback survey after it.
  const [afterUrl, setAfterUrl] = useState("planned.com/live/feedback")

  // The AI layer: one open field (words, a website, a reference picture)
  // that becomes the AI's instructions once something is generated.
  // The agent comes prepared: Planned already knows the event's website,
  // brand colours, photos and type, so styles are drafted before the
  // organiser asks. Each source can be switched off, and a short note refines.
  const [known, setKnown] = useState(knownAtStart)
  const [ask, setAsk] = useState("")
  const [asked, setAsked] = useState("")
  const [why, setWhy] = useState(false)
  const [asking, setAsking] = useState(false)
  // Extra context the organiser adds to the sources, waiting to be used
  // until they regenerate; and files attached to a refine note.
  const [extras, setExtras] = useState<Extra[]>([])
  const [attached, setAttached] = useState<string[]>([])
  const [off, setOff] = useState<Record<string, boolean>>({})
  // Sources taken out of the list entirely; the last one can be undone.
  const [removed, setRemoved] = useState<string[]>([])
  const [lastRemoved, setLastRemoved] = useState<{ key: string; name: string; extra?: Extra } | null>(null)
  const removeSource = (key: string, name: string) => {
    const extra = extras.find((e) => e.id === key)
    if (extra) setExtras((v) => v.filter((e) => e.id !== key))
    else setRemoved((v) => [...v, key])
    setLastRemoved({ key, name, extra })
    redraft()
  }
  const undoRemove = () => {
    if (!lastRemoved) return
    const { key, extra } = lastRemoved
    if (extra) setExtras((v) => [...v, extra])
    else setRemoved((v) => v.filter((k) => k !== key))
    setLastRemoved(null)
    redraft()
  }
  const toggle = (key: string) => {
    setOff((v) => ({ ...v, [key]: !v[key] }))
    redraft()
  }
  const [askedFiles, setAskedFiles] = useState<string[]>([])
  const [phase, setPhase] = useState<"thinking" | "done">("done")
  // Nothing is applied until the organiser picks a draft; choosing one is optional.
  const [style, setStyle] = useState<Style>(PLAIN)
  const [accent, setAccent] = useState(PLAIN.accent)
  const [pattern, setPattern] = useState<Pattern>("none")
  const timer = useRef<number | undefined>(undefined)
  useEffect(() => () => window.clearTimeout(timer.current), [])

  const redraft = () => {
    setPhase("thinking")
    window.clearTimeout(timer.current)
    timer.current = window.setTimeout(() => setPhase("done"), 1400)
  }
  // With nothing to go on, one click gives the agent what it needs; it then
  // drafts and applies its suggestion, as it would have done ahead of time.
  const learn = () => {
    setKnown(true)
    setPhase("thinking")
    window.clearTimeout(timer.current)
    timer.current = window.setTimeout(() => setPhase("done"), 1600)
  }
  const refine = () => {
    if (!ask.trim() && attached.length === 0) return
    setAsked(ask.trim())
    setAskedFiles(attached)
    setAsk("")
    setAttached([])
    redraft()
  }
  // Each click adds another item; names cycle, then number themselves.
  const addExtra = (kind: ExtraKind) => {
    setExtras((v) => {
      const n = v.filter((e) => e.kind === kind).length
      const names = EXTRA_NAMES[kind]
      const name = names[n % names.length]! + (n >= names.length ? ` (${Math.floor(n / names.length) + 1})` : "")
      return [...v, { id: `${kind}-${Date.now()}-${n}`, kind, name, fresh: true }]
    })
  }
  const useExtras = () => {
    setExtras((v) => v.map((e) => ({ ...e, fresh: false })))
    redraft()
  }
  const freshCount = extras.filter((e) => e.fresh).length
  const fresh = freshCount > 0
  const sourceCount =
    ["site", "colours", "photos", "type"].filter((k) => !off[k] && !removed.includes(k)).length + extras.filter((e) => !e.fresh && !off[e.id]).length
  const apply = (s: Style) => {
    setStyle(s)
    setAccent(s.accent)
    setPattern(s.pattern)
  }

  return (
    // One window tall: the preview fills the height, and the settings scroll
    // inside their own column, cut off at the window's foot.
    <div className={`flex overflow-hidden ${embedded ? "h-[760px]" : "h-screen"} ${ai ? "cool-ui" : ""} ${FONT}`} style={{ background: ai ? "#F6F7F9" : "#ffffff", color: INK, ...(ai ? ({ "--line": "#E8EAED", "--panel": "#F5F6F8", "--chip": "#EEF0F2", "--select": "#3B6FD6", "--select-bg": "#F2F6FD" } as React.CSSProperties) : {}) }}>
      {/* The sidebar: Planned's current nav for the new version; today's as it was. */}
      {ai && (
        <div className={embedded ? "flex" : "hidden lg:flex"}>
          <NewNav />
        </div>
      )}
      {!ai && (
      <aside className={`w-[248px] shrink-0 flex-col border-r px-4 py-4 ${embedded ? "flex" : "hidden lg:flex"}`} style={{ borderColor: LINE }}>
        <div className="flex items-center justify-between px-1">
          <span className="text-[19px] font-bold tracking-[0.06em]">PLANNED</span>
          <PanelLeft className="size-[16px] text-[#8a8a87]" strokeWidth={1.8} />
        </div>
        <a href="#" className="mt-5 flex items-center gap-2 px-1 text-[13px]" style={{ color: MUTED }}>
          <ArrowLeft className="size-[14px]" strokeWidth={1.8} />
          My events
        </a>
        <div className="mt-3 flex items-center gap-3 rounded-[12px] border p-2.5" style={{ borderColor: LINE }}>
          <span className="size-[38px] shrink-0 rounded-[8px]" style={{ background: "linear-gradient(135deg, #e8dcc0, #b9c9b0)" }} />
          <div className="min-w-0">
            <div className="truncate text-[13.5px] font-medium">Planned Live</div>
            <div className="truncate text-[11.5px]" style={{ color: MUTED }}>
              2026-10-06 · San Francisco
            </div>
          </div>
        </div>
        <nav className="mt-5 flex flex-col gap-0.5">
          {NAV.map(([Icon, label]) => (
            <span
              key={label}
              className={`flex items-center gap-3 rounded-[10px] px-2.5 py-2 text-[13.5px] ${label === "Attendees" ? "border bg-white" : ""}`}
              style={label === "Attendees" ? { borderColor: LINE } : undefined}
            >
              <Icon className="size-[16px] text-[#5d5d5a]" strokeWidth={1.7} />
              {label}
            </span>
          ))}
        </nav>
      </aside>
      )}

      <div
        className={`flex min-h-0 min-w-0 flex-1 flex-col ${ai ? "my-2 mr-2 overflow-hidden rounded-[10px] border shadow-[0_1px_3px_rgba(15,15,15,0.05)]" : ""}`}
        // The page itself is an even lighter blue-grey; the header and tabs stay white.
        style={ai ? { borderColor: "#E8EAED", background: "#FBFBFC" } : undefined}
      >
        <header className="flex h-[56px] shrink-0 items-center border-b bg-white px-6 text-[13.5px]" style={{ borderColor: LINE }}>
          <span style={{ color: MUTED }}>Planned Live</span>
          <span className="mx-2" style={{ color: "#c7c7c3" }}>/</span>
          <span className="font-medium">Badges</span>
        </header>
        <div className="flex shrink-0 gap-6 border-b bg-white px-6 text-[13.5px]" style={{ borderColor: LINE }}>
          {["Overview", "Check-in", "Badges", "Event app"].map((t) => (
            <span
              key={t}
              className={`py-3 ${t === "Badges" ? "border-b-2 font-medium" : ""}`}
              style={t === "Badges" ? { borderColor: SELECT } : { color: MUTED }}
            >
              {t}
            </span>
          ))}
        </div>

        <div className={`flex min-h-0 flex-1 gap-6 px-6 ${embedded ? "flex-row" : "flex-col overflow-y-auto xl:flex-row xl:overflow-hidden"}`}>
          {/* The settings, scrolling in their own column. They run right up to
              the tabs' divider and down to the window's bottom edge, and get
              cut off at both; the padding only shows at either end of the scroll. */}
          <div className={`flex min-w-0 flex-1 flex-col gap-4 pt-6 pb-6 ${ai ? "tight-cards" : ""} ${embedded ? "overflow-y-auto pr-1" : "xl:overflow-y-auto xl:pr-1"}`}>
            <div className="flex items-center justify-between">
              <h1 className="text-[22px] font-semibold tracking-[-0.01em]">Badge</h1>
              <span className="flex items-center gap-2 text-[13px]" style={{ color: MUTED }}>
                visible to
                <span className="flex items-center gap-1.5 rounded-[9px] border px-3 py-1.5 text-[13px]" style={{ borderColor: LINE, color: INK }}>
                  Everyone <ChevronDown className="size-[13px]" strokeWidth={1.8} />
                </span>
              </span>
            </div>

            {/* New, at the top: the badge's style, already drafted. The agent
                is a step ahead, working from what Planned knows about the
                event; the organiser picks, switches sources off, or asks for
                changes. Marked with Planned's own AI sparkle. */}
            {ai && !known && (
            /* Nothing to go on yet: no website, brand or photos. The agent
               doesn't leave a blank field; it says the one thing it needs,
               offers a one-click way to give it, and keeps watching. */
            <div className="rounded-[12px] border bg-white" style={{ borderColor: LINE }}>
              <div className="field-card p-4">
                {/* Title and status share a text baseline. */}
                <div className="flex items-baseline justify-between gap-2">
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-[14px] font-medium" style={{ color: INK }}>Badge style</span>
                  </div>
                  <span className="text-[11.5px]" style={{ color: MUTED }}>Waiting for your brand</span>
                </div>
                <div className="mt-3 rounded-[10px] px-3.5 py-3" style={{ background: PANEL }}>
                  <div className="text-[13px] font-medium">I don&apos;t know this event&apos;s brand yet</div>
                  <p className="mt-0.5 text-[12px] leading-snug" style={{ color: MUTED }}>
                    Point me to your website or add a logo, and I&apos;ll have three styles ready. I&apos;ll also pick it up on my own once your event site is live.
                  </p>
                  <div className="mt-2.5 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={learn}
                      className="flex items-center gap-1.5 rounded-[8px] px-3 py-1.5 text-[12.5px] font-medium text-white"
                      style={{ background: "#1d1d1b" }}
                    >
                      <Globe className="size-[13px]" strokeWidth={1.8} />
                      Use the event website
                    </button>
                    <button
                      type="button"
                      onClick={learn}
                      className="flex items-center gap-1.5 rounded-[8px] border bg-white px-3 py-1.5 text-[12.5px] font-medium transition-colors hover:bg-[#f4f4f2]"
                      style={{ borderColor: LINE }}
                    >
                      <Upload className="size-[13px]" strokeWidth={1.8} />
                      Upload a logo
                    </button>
                  </div>
                </div>
              </div>
            </div>
            )}

            {ai && known && (
            <div className="rounded-[12px] border bg-white" style={{ borderColor: LINE }}>
              <div className="field-card p-4">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[14px] font-medium" style={{ color: INK }}>Badge style</span>
                  </div>
                  {/* A quiet way to steer, up in the header. */}
                  {phase === "thinking" ? (
                    /* One steady status, with a light sweeping across the words. */
                    <span className="text-shimmer text-[12px]">Regenerating…</span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setAsking(true)}
                      className="-my-1 flex items-center gap-1 rounded-[7px] border bg-white px-2 py-[2px] text-[11.5px] transition-colors hover:bg-[#fafaf8]"
                      style={{ borderColor: LINE, color: INK }}
                    >
                      <Pencil className="size-[10px]" strokeWidth={1.8} style={{ color: MUTED }} />
                      Refine
                    </button>
                  )}
                </div>
                <p className="mt-1 text-[12.5px]" style={{ color: MUTED }}>
                  Three styles drafted from your event&apos;s brand. Pick one, or ask for changes.
                </p>

                {/* The drafts, ready before anyone asked. */}
                <div className="mt-3 grid grid-cols-3 gap-2.5">
                  {DRAFTS.map((d, k) => {
                    const on = style.id === d.id
                    return phase === "thinking" ? (
                      /* Shaped like the card that's coming: a preview with a
                         ghost badge, and two soft lines for its name. */
                      <div key={d.id} className="flex h-[143px] flex-col overflow-hidden rounded-[10px] border" style={{ borderColor: LINE }}>
                        <span className="flex h-[84px] items-center justify-center" style={{ background: PANEL }}>
                          <span className="relative block h-[58px] w-[42px] overflow-hidden rounded-[5px] bg-white shadow-[0_2px_6px_rgba(15,15,15,0.06)]">
                            <span className="rb-skel rb-on" style={{ animationDelay: `${k * 140}ms` }} />
                          </span>
                        </span>
                        <span className="flex flex-col gap-1.5 px-3 py-3">
                          <span className="relative block h-[9px] w-[58%] overflow-hidden rounded-full">
                            <span className="rb-skel rb-on" style={{ animationDelay: `${k * 140 + 80}ms` }} />
                          </span>
                          <span className="relative block h-[8px] w-[78%] overflow-hidden rounded-full">
                            <span className="rb-skel rb-on" style={{ animationDelay: `${k * 140 + 160}ms` }} />
                          </span>
                        </span>
                      </div>
                    ) : (
                      <button
                        key={d.id}
                        type="button"
                        // Picking is optional: clicking the chosen draft again
                        // goes back to the standard badge.
                        onClick={() => apply(on ? PLAIN : d)}
                        aria-pressed={on}
                        // Built exactly like the Badge template cards below.
                        className="view-in flex flex-col justify-start overflow-hidden rounded-[10px] border text-left transition-colors"
                        style={{ borderColor: on ? SELECT : LINE, animationDelay: `${k * 90}ms` }}
                      >
                        <span className="relative flex h-[84px] items-center justify-center" style={{ background: PANEL }}>
                          <MiniBadge style={d} />
                          <span className="absolute top-2 right-2">
                            <Radio on={on} />
                          </span>
                          {k === 0 && (
                            <span className="absolute top-2 left-2 flex items-center gap-1 rounded-full bg-white py-[2px] pr-2 pl-1.5 text-[10.5px] font-medium shadow-[0_1px_2px_rgba(15,15,15,0.06)]" style={{ color: INK }}>
                              <AiLabel size={10} />
                              Suggested
                            </span>
                          )}
                        </span>
                        <span className="block px-3 py-2.5">
                          <span className="block text-[13px] font-medium">{d.name}</span>
                          <span className="block text-[11.5px]" style={{ color: MUTED }}>
                            {d.blurb}
                          </span>
                        </span>
                      </button>
                    )
                  })}
                </div>

                {/* One quiet line under the drafts: where they came from, and a
                    way to ask for changes. Neither takes space until it's used. */}
                {asking ? (
                  <form
                    onSubmit={(e) => {
                      e.preventDefault()
                      refine()
                      setAsking(false)
                    }}
                    className="view-in mt-3 rounded-[10px] border bg-white focus-within:border-[#b5b5b1]"
                    style={{ borderColor: LINE }}
                  >
                    {/* Anything attached: pictures, files, links. */}
                    {attached.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 px-2.5 pt-2.5">
                        {attached.map((f) => (
                          <span key={f} className="flex items-center gap-1.5 rounded-[8px] border py-[3px] pr-1 pl-1 text-[11.5px]" style={{ borderColor: LINE, background: PANEL }}>
                            <span className="size-[18px] rounded-[4px]" style={{ background: f.endsWith(".pdf") ? "#e9ecea" : "linear-gradient(135deg,#9FB3B6,#E6DDB2 55%,#AFDBD0)" }} />
                            {f}
                            <button type="button" aria-label={`Remove ${f}`} onClick={() => setAttached((v) => v.filter((x) => x !== f))} className="flex size-[16px] items-center justify-center rounded-[4px] hover:bg-white" style={{ color: MUTED }}>
                              <X className="size-[11px]" strokeWidth={2} />
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                    {/* Attach on the left; Refine and close on the right, evenly spaced. */}
                    <div className="flex items-center gap-1 py-1 pr-1 pl-1">
                      <button
                        type="button"
                        aria-label="Attach a picture or file"
                        title="Attach a picture or file"
                        onClick={() => {
                          const next = ["reference.jpg", "moodboard.png", "sponsor-logos.pdf"].find((f) => !attached.includes(f))
                          if (next) setAttached((v) => [...v, next])
                        }}
                        className="flex size-[28px] shrink-0 items-center justify-center rounded-[8px] hover:bg-[#f4f4f2]"
                        style={{ color: MUTED }}
                      >
                        <Paperclip className="size-[14px]" strokeWidth={1.8} />
                      </button>
                      <input
                        autoFocus
                        value={ask}
                        onChange={(e) => setAsk(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Escape") setAsking(false)
                        }}
                        placeholder="Like “warmer”, or attach a picture"
                        aria-label="Ask for changes"
                        className="min-w-0 flex-1 bg-transparent py-1 pl-0.5 text-[13px] outline-none placeholder:text-[#a3a3a0]"
                      />
                      {/* Send, chat-style: a small square with an arrow. */}
                      <button
                        type="submit"
                        aria-label="Refine"
                        title="Refine"
                        disabled={!ask.trim() && attached.length === 0}
                        className="flex size-[26px] shrink-0 items-center justify-center rounded-[8px] text-white transition-colors"
                        style={{ background: ask.trim() || attached.length ? "#1d1d1b" : "#c9c9c6" }}
                      >
                        <ArrowUp className="size-[14px]" strokeWidth={2.2} />
                      </button>
                      <button
                        type="button"
                        aria-label="Close"
                        onClick={() => setAsking(false)}
                        className="flex size-[28px] shrink-0 items-center justify-center rounded-[8px] hover:bg-[#f4f4f2]"
                        style={{ color: MUTED }}
                      >
                        <X className="size-[14px]" strokeWidth={1.8} />
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="mt-3 flex items-center">
                    <button
                      type="button"
                      onClick={() => setWhy((v) => !v)}
                      aria-expanded={why}
                      className="flex items-center gap-2 text-[12px] transition-colors hover:text-[#1d1d1b]"
                      style={{ color: MUTED }}
                    >
                      {/* The sources, as a little overlapping stack of discs. */}
                      <span className="flex -space-x-[5px] pl-[2px]">
                        {[
                          <Globe key="g" className="size-[11px]" strokeWidth={1.8} style={{ color: INK }} />,
                          null,
                          null,
                          <span key="t" className="text-[8.5px] font-semibold tracking-[-0.02em]" style={{ color: INK }}>Aa</span>,
                        ].map((inner, k) => (
                          <span
                            key={k}
                            className="relative flex size-[20px] items-center justify-center rounded-full"
                            style={{
                              zIndex: 4 - k,
                              // A crisp white outline with a soft drop shadow around it,
                              // and shading inside like a small glossy orb.
                              boxShadow:
                                "0 0 0 2px #fff, 0 3px 7px -1px rgba(15,15,15,0.22), 0 1px 2px rgba(15,15,15,0.1), inset 0 -2px 3px rgba(15,15,15,0.14), inset 0 1px 1px rgba(255,255,255,0.7)",
                              background:
                                k === 1
                                  ? `conic-gradient(${BRAND[0]} 0 25%, ${BRAND[1]} 0 50%, ${BRAND[2]} 0 75%, ${BRAND[3]} 0)`
                                  : k === 2
                                    ? "linear-gradient(135deg,#9FB3B6,#E6DDB2 55%,#AFDBD0)"
                                    : "#f3f3f0",
                            }}
                          >
                            {inner}
                            <span
                              aria-hidden
                              className="pointer-events-none absolute inset-0 rounded-full"
                              style={{ background: "radial-gradient(circle at 32% 26%, rgba(255,255,255,0.75), rgba(255,255,255,0) 52%)" }}
                            />
                          </span>
                        ))}
                      </span>
                      Drafted from {sourceCount} sources
                      <ChevronDown className={`size-[13px] transition-transform ${why ? "rotate-180" : ""}`} strokeWidth={1.8} />
                    </button>
                  </div>
                )}
                {why && (
                  <div className="view-in mt-2 overflow-hidden rounded-[10px] border" style={{ borderColor: LINE }}>
                      {(
                        [
                          ["site", "planned.com/live", "Hazy skies, soft cloud, mint paint and grain", <Globe key="i" className="size-[14px]" strokeWidth={1.7} />],
                          [
                            "colours",
                            "Brand colours",
                            "Slate-teal ink and warm cream",
                            <span key="i" className="grid grid-cols-2 gap-[2px]">
                              {BRAND.map((c) => (
                                <span key={c} className="size-[6px] rounded-full" style={{ background: c }} />
                              ))}
                            </span>,
                          ],
                          [
                            "photos",
                            "12 event photos",
                            "The soft, airy light",
                            <span key="i" className="size-[18px] rounded-[4px]" style={{ background: "linear-gradient(135deg,#9FB3B6,#E6DDB2 55%,#AFDBD0)" }} />,
                          ],
                          ["type", "Geist", "The brand's type, for names", <span key="i" className="text-[11px] font-semibold">Aa</span>],
                        ] as const
                      ).filter(([k]) => !removed.includes(k)).map(([k, name, took, icon]) => (
                        <div key={k} className="flex items-center gap-3 px-3 py-2.5">
                          <span className="flex size-[28px] shrink-0 items-center justify-center rounded-[8px]" style={{ background: PANEL, opacity: off[k] ? 0.45 : 1 }}>
                            {icon}
                          </span>
                          <span className="min-w-0 flex-1 leading-tight" style={{ opacity: off[k] ? 0.55 : 1 }}>
                            <span className="block text-[12.5px] font-medium">{name}</span>
                            <span className="block text-[11.5px]" style={{ color: MUTED }}>
                              {off[k] ? "Not used" : took}
                            </span>
                          </span>
                          <span className="flex items-center gap-1.5">
                            <MiniSwitch on={!off[k]} onClick={() => toggle(k)} label={`Use ${name}`} />
                            <RemoveButton label={`Remove ${name}`} onClick={() => removeSource(k, name)} />
                          </span>
                        </div>
                      ))}
                      {/* Context the organiser added. */}
                      {extras.map((e) => {
                        const Icon = e.kind === "link" ? Link2 : e.kind === "images" ? ImageIcon : FileText
                        return (
                          <div key={e.id} className="view-in flex items-center gap-3 px-3 py-2.5">
                            <span className="flex size-[28px] shrink-0 items-center justify-center rounded-[8px]" style={{ background: PANEL }}>
                              <Icon className="size-[14px]" strokeWidth={1.7} />
                            </span>
                            <span className="min-w-0 flex-1 leading-tight">
                              <span className="block text-[12.5px] font-medium">{e.name}</span>
                              <span className="block text-[11.5px]" style={{ color: MUTED }}>
                                {e.fresh ? "Added by you, not used yet" : "Added by you"}
                              </span>
                            </span>
                            {e.fresh && (
                              <span className="rounded-full px-1.5 py-[1px] text-[10px] font-medium" style={{ background: "#e3f0ed", color: "#294B4F" }}>
                                New
                              </span>
                            )}
                            <span className="flex items-center gap-1.5">
                              <MiniSwitch on={!off[e.id]} onClick={() => setOff((v) => ({ ...v, [e.id]: !v[e.id] }))} label={`Use ${e.name}`} />
                              <RemoveButton label={`Remove ${e.name}`} onClick={() => removeSource(e.id, e.name)} />
                            </span>
                          </div>
                        )
                      })}
                      {/* New context waiting to be used: one clear prompt to redraft. */}
                      {fresh && (
                        <div className="view-in mx-2 mb-1.5 flex items-center justify-between gap-3 rounded-[9px] py-1.5 pr-1.5 pl-3" style={{ background: "#eef6f4" }}>
                          <span className="text-[12px]" style={{ color: "#294B4F" }}>
                            {freshCount} new {freshCount === 1 ? "source" : "sources"} not used yet
                          </span>
                          <button
                            type="button"
                            onClick={useExtras}
                            className="rounded-[7px] px-2.5 py-1 text-[12px] font-medium text-white"
                            style={{ background: "#1d1d1b" }}
                          >
                            Regenerate
                          </button>
                        </div>
                      )}

                      {(asked || askedFiles.length > 0) && (
                        <div className="flex items-center gap-3 px-3 py-2.5">
                          <span className="flex size-[28px] shrink-0 items-center justify-center rounded-[8px]" style={{ background: PANEL }}>
                            <Pencil className="size-[13px]" strokeWidth={1.8} />
                          </span>
                          <span className="min-w-0 flex-1 leading-tight">
                            <span className="block text-[12.5px] font-medium">Your note</span>
                            <span className="block truncate text-[11.5px]" style={{ color: MUTED }}>
                              {[asked && `“${asked}”`, ...askedFiles].filter(Boolean).join(" + ")}
                            </span>
                          </span>
                          {/* Edit reopens the field with the note in it; remove drops it and redrafts. */}
                          <span className="flex items-center gap-0.5">
                            <button
                              type="button"
                              aria-label="Edit your note"
                              title="Edit"
                              onClick={() => {
                                setAsk(asked)
                                setAttached(askedFiles)
                                setAsking(true)
                              }}
                              className="flex size-[24px] shrink-0 items-center justify-center rounded-[7px] transition-colors hover:bg-[#f1f1ee]"
                              style={{ color: MUTED }}
                            >
                              <Pencil className="size-[12px]" strokeWidth={1.8} />
                            </button>
                            <RemoveButton
                              label="Remove your note"
                              onClick={() => {
                                setAsked("")
                                setAskedFiles([])
                                redraft()
                              }}
                            />
                          </span>
                        </div>
                      )}

                      {lastRemoved && (
                        <div className="view-in flex items-center justify-between px-3 py-2 text-[11.5px]" style={{ color: MUTED }}>
                          Removed {lastRemoved.name}
                          <button type="button" onClick={undoRemove} className="rounded-[6px] px-1.5 py-[2px] font-medium hover:bg-[#f1f1ee]" style={{ color: INK }}>
                            Undo
                          </button>
                        </div>
                      )}

                      {/* Add more context, then regenerate. */}
                      <div className="flex flex-wrap items-center gap-1.5 border-t px-3 py-2.5" style={{ borderColor: LINE }}>
                        {(
                          [
                            ["link", "Link", Link2],
                            ["images", "Images", ImageIcon],
                            ["file", "Brand guidelines", FileText],
                          ] as const
                        ).map(([kind, label, Icon]) => {
                          return (
                            <button
                              key={kind}
                              type="button"
                              onClick={() => addExtra(kind)}
                              className="flex items-center gap-1 rounded-full border bg-white py-[3px] pr-2.5 pl-2 text-[11.5px] font-medium transition-colors hover:bg-[#fafaf8] disabled:opacity-40"
                              style={{ borderColor: LINE, color: INK }}
                            >
                              <Plus className="size-[11px]" strokeWidth={2} style={{ color: MUTED }} />
                              <Icon className="size-[11px]" strokeWidth={1.8} style={{ color: MUTED }} />
                              {label}
                            </button>
                          )
                        })}
                        {/* A note goes in the same place as Refine; an existing note opens to edit. */}
                        <button
                          type="button"
                          onClick={() => {
                            setAsk(asked)
                            setAttached(askedFiles)
                            setAsking(true)
                          }}
                          className="flex items-center gap-1 rounded-full border bg-white py-[3px] pr-2.5 pl-2 text-[11.5px] font-medium transition-colors hover:bg-[#fafaf8]"
                          style={{ borderColor: LINE, color: INK }}
                        >
                          <Plus className="size-[11px]" strokeWidth={2} style={{ color: MUTED }} />
                          <Pencil className="size-[11px]" strokeWidth={1.8} style={{ color: MUTED }} />
                          Note
                        </button>
                      </div>


                  </div>
                )}
              </div>
            </div>
            )}

            {ai ? (
              <>
            {/* Size, set like the other options: a titled card, a small
                picture of each shape, and the radio in the top corner. */}
            <Card className="p-4">
              <div className="text-[13px]" style={{ color: MUTED }}>Badge size</div>
              <div className="mt-3 grid grid-cols-2 gap-2.5">
                {(
                  [
                    ["portrait", "4 × 6 in", "Portrait", 22, 32],
                    ["landscape", "6 × 4 in", "Landscape", 32, 22],
                  ] as const
                ).map(([id, t, d, w, h]) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setSize(id)}
                    className="relative flex items-center gap-3 rounded-[10px] border p-2.5 text-left transition-colors"
                    style={{ borderColor: size === id ? SELECT : LINE }}
                  >
                    <span className="flex size-[48px] shrink-0 items-center justify-center rounded-[8px]" style={{ background: PANEL }}>
                      {/* The badge's shape, with its slot. */}
                      <span
                        className="relative rounded-[3px] border bg-white shadow-[0_1px_2px_rgba(15,15,15,0.06)]"
                        style={{ width: w, height: h, borderColor: "#d9d9d5" }}
                      >
                        <span className="absolute top-[3px] left-1/2 h-[2px] w-[7px] -translate-x-1/2 rounded-full bg-[#cfcfcb]" />
                      </span>
                    </span>
                    <span className="min-w-0 pr-5">
                      <span className="block text-[13px] font-medium">{t}</span>
                      <span className="block text-[11.5px]" style={{ color: MUTED }}>{d}</span>
                    </span>
                    <span className="absolute top-2 right-2">
                      <Radio on={size === id} />
                    </span>
                  </button>
                ))}
              </div>
            </Card>
              </>
            ) : (
              /* Today's size cards, unchanged. */
            <div className="grid grid-cols-2 gap-3">
              {(
                [
                  ["portrait", "4 × 6 in", "Portrait. Fits standard lanyard holders."],
                  ["landscape", "6 × 4 in", "Landscape. More room for company and role."],
                ] as const
              ).map(([id, t, d]) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setSize(id)}
                  className="rounded-[12px] border p-4 text-left transition-colors"
                  style={{ borderColor: size === id ? SELECT : LINE }}
                >
                  <Radio on={size === id} />
                  <div className="mt-3 text-[14px] font-medium">{t}</div>
                  <div className="mt-1 text-[12px]" style={{ color: MUTED }}>{d}</div>
                </button>
              ))}
            </div>
            )}

            <Card className="p-4">
              <div className="text-[13px]" style={{ color: MUTED }}>Badge template</div>
              <div className="mt-3 grid grid-cols-3 gap-2.5">
                {(
                  [
                    ["window", "Print window", "Pre-printed color stock"],
                    ["band", "Top band", "Clean, high-contrast"],
                    ["big", "Big type", "Maximum legibility"],
                  ] as const
                ).map(([id, t, d]) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setTemplate(id)}
                    // Stacked from the top: a button centres its contents by
                    // default, which left a white strip above the preview.
                    className="flex flex-col justify-start overflow-hidden rounded-[10px] border text-left"
                    style={{ borderColor: template === id ? SELECT : LINE }}
                  >
                    <span className="relative flex h-[84px] items-center justify-center" style={{ background: PANEL }}>
                      <MiniBadge window={id === "window"} band={id === "band"} big={id === "big"} />
                      <span className="absolute top-2 right-2">
                        <Radio on={template === id} />
                      </span>
                    </span>
                    <span className="block px-3 py-2.5">
                      <span className="block text-[13px] font-medium">{t}</span>
                      <span className="block text-[11.5px]" style={{ color: MUTED }}>{d}</span>
                    </span>
                  </button>
                ))}
              </div>
            </Card>

            <Card className="p-4">
              <div className="text-[13px]" style={{ color: MUTED }}>Attendee colors</div>
              <div className="mt-3 flex flex-wrap gap-2">
                {ROLES.map((r) => (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => {
                      setRole(r.id)
                      setHexDraft(null)
                    }}
                    className="flex items-center gap-2 rounded-[9px] border px-3 py-1.5 text-[13px]"
                    style={{ borderColor: role === r.id ? SELECT : LINE, background: role === r.id ? SELECT_BG : "#fff" }}
                  >
                    <span className="size-[13px] rounded-[3px] transition-colors" style={{ background: colorFor(r.id) }} />
                    {r.id}
                  </button>
                ))}
              </div>
              {/* The selected type's colour: a swatch that opens a picker, and its hex. */}
              <div className="mt-3 flex items-center gap-2.5">
                <label className="relative block size-[34px] shrink-0 cursor-pointer overflow-hidden rounded-[8px] border" style={{ borderColor: LINE, background: colorFor(role) }}>
                  <input
                    type="color"
                    aria-label={`${role} colour`}
                    value={colorFor(role)}
                    onChange={(e) => {
                      setCustom((v) => ({ ...v, [role]: e.target.value.toUpperCase() }))
                      setHexDraft(null)
                    }}
                    className="absolute inset-0 size-full cursor-pointer opacity-0"
                  />
                </label>
                <input
                  aria-label={`${role} colour hex`}
                  value={hexDraft ?? colorFor(role).toUpperCase()}
                  onChange={(e) => {
                    const v = e.target.value.trim()
                    setHexDraft(v)
                    const hex = v.startsWith("#") ? v : `#${v}`
                    if (/^#[0-9a-fA-F]{6}$/.test(hex)) setCustom((c) => ({ ...c, [role]: hex.toUpperCase() }))
                  }}
                  onBlur={() => setHexDraft(null)}
                  className="h-[34px] w-[220px] rounded-[9px] border bg-white px-3 text-[13px] tabular-nums outline-none focus:border-[#b5b5b1]"
                  style={{ borderColor: LINE }}
                />
              </div>
              <p className="mt-3 text-[12px]" style={{ color: MUTED }}>
                The color is produced on pre-printed stock. On-site thermal printers add attendee details in black only.
              </p>
            </Card>

            <Card className="flex flex-col gap-3 p-4">
              <div className="text-[13px]" style={{ color: MUTED }}>Badge content</div>
              <Toggle on={showName} onClick={() => setShowName((v) => !v)} label="Guest's full name" />
              <Toggle on={showCompany} onClick={() => setShowCompany((v) => !v)} label="Company" />
            </Card>

            {/* New: the badge's code as a way in. Only in the new version. */}
            {ai && (
              <Card className="flex flex-col gap-3 p-4">
                <div className="flex items-center justify-between">
                  <div className="text-[13px]" style={{ color: MUTED }}>Badge code</div>
                  <span className="rounded-full px-2 py-[2px] text-[11px]" style={{ background: "var(--chip, #f1f1ee)", color: MUTED }}>New</span>
                </div>
                <Toggle on={codeLink} onClick={() => setCodeLink((v) => !v)} label="Code on badge, opens a link" />
                {codeLink && (
                  <div className="view-in flex flex-col gap-2.5 pl-[46px]">
                    <p className="text-[12px] leading-snug" style={{ color: MUTED }}>
                      The code uses a Planned link, so where it leads can change after the badges are printed.
                    </p>
                    {/* During the event. */}
                    <label className="block">
                      <span className="mb-1 block text-[12px] font-medium" style={{ color: INK }}>During the event</span>
                      <input
                        value={codeUrl}
                        onChange={(e) => setCodeUrl(e.target.value)}
                        className="w-full rounded-[9px] border bg-white px-3 py-1.5 text-[13px] outline-none focus:border-[#b5b5b1]"
                        style={{ borderColor: LINE }}
                      />
                    </label>
                    {/* After the event: the agent's suggestion, editable or clearable. */}
                    <label className="block">
                      <span className="mb-1 flex items-center justify-between">
                        <span className="text-[12px] font-medium" style={{ color: INK }}>After the event</span>
                        {afterUrl === "planned.com/live/feedback" && (
                          <span className="flex items-center gap-1 text-[11px]" style={{ color: MUTED }}>
                            <AiLabel size={10} />
                            Suggested
                          </span>
                        )}
                      </span>
                      <span className="relative block">
                        <input
                          value={afterUrl}
                          onChange={(e) => setAfterUrl(e.target.value)}
                          placeholder="Keep the same link"
                          className="w-full rounded-[9px] border bg-white py-1.5 pr-8 pl-3 text-[13px] outline-none placeholder:text-[#a3a3a0] focus:border-[#b5b5b1]"
                          style={{ borderColor: LINE }}
                        />
                        {afterUrl && (
                          <button
                            type="button"
                            aria-label="Clear the after-event link"
                            onClick={() => setAfterUrl("")}
                            className="absolute top-1/2 right-1.5 flex size-[22px] -translate-y-1/2 items-center justify-center rounded-[6px] hover:bg-[#f1f1ee]"
                            style={{ color: MUTED }}
                          >
                            <X className="size-[12px]" strokeWidth={1.8} />
                          </button>
                        )}
                      </span>
                    </label>
                  </div>
                )}
              </Card>
            )}
          </div>

          {/* The live preview. */}
          <div className={embedded ? "w-[440px] shrink-0 pt-6 pb-6" : `pb-6 xl:shrink-0 xl:self-stretch xl:pt-6 ${ai ? "xl:w-[560px] 2xl:w-[600px]" : "xl:w-[440px]"}`}>
            {/* The preview fills the page's height; the strap runs in from its
                top edge and the badge hangs centred in the frame. */}
            <div
              className={`relative h-full overflow-hidden rounded-[16px] border ${embedded ? "" : "min-h-[600px]"}`}
              // New version: a cool blue-grey to sit with the page; today's keeps its warm grey.
              style={ai ? { borderColor: "#E7E9EC", background: "#F4F5F7" } : { borderColor: LINE, background: PANEL }}
            >
              <div className="absolute inset-x-4 top-4 z-20 flex items-center justify-between text-[12.5px]" style={{ color: MUTED }}>
                <span>Preview</span>
                {style.id !== "plain" && <span className="rounded-full bg-white px-2 py-[2px]">{style.name}</span>}
              </div>
              {ai ? (
                /* The new version: the badge as it's worn, hanging in 3D. Full
                   page, it's drawn a little larger, still centred. */
                <div className={`absolute inset-0 flex justify-center ${embedded ? "" : "xl:scale-[1.15]"}`}>
                  <HangingBadge
                    size={size}
                    template={template}
                    role={role}
                    style={style}
                    accent={accent}
                    pattern={pattern}
                    showName={showName}
                    showCompany={showCompany}
                    roleColorOverride={custom[role]}
                    loading={phase === "thinking"}
                    link={codeLink && codeUrl.trim() ? codeUrl.trim() : undefined}
                    showCode={codeLink}
                  />
                </div>
              ) : (
                /* Today's builder: the flat badge, centred, as it is now. */
                <div className="absolute inset-0 flex items-center justify-center">
                  <Badge
                    size={size}
                    template={template}
                    role={role}
                    style={style}
                    accent={accent}
                    pattern={pattern}
                    showName={showName}
                    showCompany={showCompany}
                    roleColorOverride={custom[role]}
                  />
                </div>
              )}
              {/* New: order the printed badges without leaving the page. */}
              {ai && <OrderCard styleName={style.id !== "plain" ? style.name : undefined} size={size} />}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
