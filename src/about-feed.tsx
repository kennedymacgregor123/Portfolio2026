import { useLayoutEffect, useRef } from "react"

/*
 * A small feed under the bio: what I've been up to lately, one post per
 * card. Each post has a picture on the left (a little illustration, drawn
 * here rather than loaded) and, beside it, a title and a line or two.
 *
 * Once the signature has finished drawing, the cards arrive as one deck
 * where the first card sits, then spread out from it, one by one, into place.
 */

type Post = {
  /** One line saying what it is, in the same voice as the bio. */
  title: React.ReactNode
  text: string
  icon: React.ReactNode
}

const POSTS: Post[] = [
  {
    title: (
      <>
        Reading <em>Think Again</em> by Adam Grant
      </>
    ),
    text: "On the value of rethinking and unlearning: holding opinions loosely, changing your mind when the evidence does, and getting curious about what you might be wrong about.",
    icon: <BookIcon />,
  },
  {
    title: "Painting art for the apartment",
    text: "My next side quest: painting my own pieces for the empty walls, instead of buying prints to fill them.",
    icon: <EaselIcon />,
  },
  {
    title: (
      <>
        Watched <em>The Odyssey</em>
      </>
    ),
    text: "Odysseus's long, monster-filled journey home after the Trojan War, back across the sea to Ithaca.",
    icon: <PosterIcon />,
  },
  {
    title: "Furnishing my new apartment",
    text: "Current state: the second room is where all the boxes I haven't unpacked are living. The complicated furniture, at least, is all built.",
    icon: <ChairIcon />,
  },
  {
    title: "Back from Portugal",
    text: "Tiled streets, custard tarts and a lot of walking uphill.",
    icon: <TileIcon />,
  },
]

/** How long the stack takes to appear, and the gap between cards dealt. */
const STACK_MS = 450
const DEAL_GAP_MS = 110

export function AboutFeed({ start }: { start: boolean }) {
  // A beat after the signature finishes, so the two don't run together.
  const delay = 200
  const listRef = useRef<HTMLUListElement>(null)

  /* Each card starts tucked behind the first, like a neat deck: a little
     lower, a little smaller and fainter the further back it sits, with only
     the first few edges showing. Measured before the first paint, so the
     deck is in place when it appears. */
  useLayoutEffect(() => {
    const list = listRef.current
    if (!list) return
    const cards = [...list.children] as HTMLElement[]
    const top = cards[0]?.offsetTop ?? 0
    cards.forEach((c, i) => {
      const depth = Math.min(i, 3)
      // Align each card's top with the first's, then drop it by its depth.
      c.style.setProperty("--dy", `${top - c.offsetTop + depth * 9}px`)
      c.style.setProperty("--s", `${1 - depth * 0.04}`)
      c.style.setProperty("--o", `${i > 2 ? 0 : 1 - depth * 0.25}`)
    })
  }, [])

  return (
    <ul
      ref={listRef}
      aria-label="What I'm up to"
      className={`about-feed mt-16 flex flex-col gap-3 ${start ? "feed-deck feed-go" : "opacity-0"}`}
      style={{ animationDelay: `${delay}ms` }}
    >
      {POSTS.map((p, i) => (
        <li
          key={i}
          className="feed-deal feed-card p-5 sm:p-6"
          style={{
            // The first card is the top of the deck.
            zIndex: POSTS.length - i,
            animationDelay: `${delay + STACK_MS + 150 + (i - 1) * DEAL_GAP_MS}ms`,
          }}
        >
          {/* Tucked in the deck, a card behind the first shows only its
              edge: its contents fade in as it comes out. */}
          <div
            className={`flex gap-5 ${i ? "feed-deal-content" : ""}`}
            style={i ? { animationDelay: `${delay + STACK_MS + 150 + (i - 1) * DEAL_GAP_MS + 120}ms` } : undefined}
          >
            <div className="flex w-12 shrink-0 items-start justify-center pt-0.5" aria-hidden>
              {p.icon}
            </div>
            <div className="flex min-w-0 flex-col gap-1">
              <h3 className="about-text !text-[#0f0f0f] font-medium">{p.title}</h3>
              <p className="about-text">{p.text}</p>
            </div>
          </div>
        </li>
      ))}
    </ul>
  )
}

/* ---------- The pictures ---------- */

/** A paperback standing slightly turned, its spine showing. */
function BookIcon() {
  return (
    <svg viewBox="0 0 48 60" className="fx-rock w-11 drop-shadow-[0_4px_6px_rgba(15,15,15,0.14)]">
      <path d="M6 4 L10 2 L10 58 L6 59 Z" fill="#d9cfa8" />
      <rect x="10" y="2" width="34" height="56" rx="1.5" fill="#f6efd6" />
      <rect x="10" y="2" width="2.5" height="56" fill="#0f0f0f" opacity="0.06" />
      <text x="27" y="20" textAnchor="middle" fontFamily="Inter Variable, sans-serif" fontWeight="800" fontSize="7.4" fill="#1d1d1b" letterSpacing="0.3">
        THINK
      </text>
      {/* The second word turned around, rethought. */}
      <text
        x="27"
        y="29"
        textAnchor="middle"
        fontFamily="Inter Variable, sans-serif"
        fontWeight="800"
        fontSize="7.4"
        fill="#1d1d1b"
        letterSpacing="0.3"
        transform="rotate(180 27 26.5)"
      >
        AGAIN
      </text>
      <circle cx="27" cy="40" r="4.2" fill="none" stroke="#e0533d" strokeWidth="1.6" />
      <path d="M30.4 37.4 l1.6 -1.8 l0.4 2.4" fill="none" stroke="#e0533d" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
      <text x="27" y="53" textAnchor="middle" fontFamily="Inter Variable, sans-serif" fontWeight="600" fontSize="3.8" fill="#4a4a4a" letterSpacing="0.4">
        ADAM GRANT
      </text>
    </svg>
  )
}

/** A film poster: a lone ship under a full moon on a dark sea. */
function PosterIcon() {
  return (
    <svg viewBox="0 0 44 60" className="w-10 drop-shadow-[0_4px_6px_rgba(15,15,15,0.16)]">
      <defs>
        <linearGradient id="poster-sky" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="#0e1a2b" />
          <stop offset="0.62" stopColor="#3a4a63" />
          <stop offset="0.62" stopColor="#14263a" />
          <stop offset="1" stopColor="#0b1624" />
        </linearGradient>
        <clipPath id="poster-clip">
          <rect x="1" y="1" width="42" height="58" rx="2" />
        </clipPath>
      </defs>
      <g clipPath="url(#poster-clip)">
        <rect x="1" y="1" width="42" height="58" fill="url(#poster-sky)" />
        <circle cx="29" cy="15" r="6.5" fill="#f1e3bf" />
        {/* The moon's path on the water. */}
        <rect className="fx-glimmer" x="27.5" y="38" width="3" height="10" fill="#f1e3bf" opacity="0.25" />
        {/* Waves. */}
        <path className="fx-waves" d="M-7 40 q 4 -2.4 8 0 t 8 0 t 8 0 t 8 0 t 8 0 t 8 0 t 8 0" fill="none" stroke="#5d7391" strokeWidth="0.8" />
        {/* The ship: hull, mast and a square sail. */}
        <g className="fx-bob">
          <path d="M9 36 h15 l-2.6 3.4 h-9.8 Z" fill="#0b0f16" />
          <line x1="16.5" x2="16.5" y1="22" y2="36" stroke="#0b0f16" strokeWidth="0.9" />
          <path d="M11.5 24 h10 c -0.6 4, -0.6 7, 0 10 h-10 c 0.6 -3, 0.6 -6, 0 -10 Z" fill="#c9533f" />
        </g>
      </g>
      <text x="22" y="54" textAnchor="middle" fontFamily="Georgia, serif" fontSize="5" fill="#f1e3bf" letterSpacing="0.8">
        THE ODYSSEY
      </text>
    </svg>
  )
}

/**
 * The apartment so far: one good chair with a cushion thrown on it, a lamp
 * that hasn't found its table yet, and a box that still isn't unpacked.
 */
function ChairIcon() {
  return (
    <svg viewBox="0 0 60 56" className="w-[52px] drop-shadow-[0_4px_6px_rgba(15,15,15,0.12)]">
      <defs>
        <linearGradient id="chair-fabric" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="#e2b98f" />
          <stop offset="1" stopColor="#c8956a" />
        </linearGradient>
      </defs>
      {/* The lamp, on the floor behind, its shade tipped. */}
      <path d="M50 30 L50 52" stroke="#3a3a38" strokeWidth="1.3" strokeLinecap="round" />
      <path d="M46 52 h8" stroke="#3a3a38" strokeWidth="1.6" strokeLinecap="round" />
      {/* The lamp slowly dims and comes back up: its shade darkens, and the
          chair and box beside it fall into shadow with it. */}
      <path className="fx-shade" d="M44 22 L56 22 L53 14 L47 14 Z" fill="#f2d77e" transform="rotate(-8 50 18)" />
      <g className="fx-lit">
      {/* Legs. */}
      <path d="M11 40 L8 52" stroke="#8a5a36" strokeWidth="2.4" strokeLinecap="round" />
      <path d="M38 40 L41 52" stroke="#8a5a36" strokeWidth="2.4" strokeLinecap="round" />
      {/* Back. */}
      <path d="M10 12 C 10 8, 13 6, 18 6 H 31 C 36 6, 39 8, 39 12 L 39 33 H 10 Z" fill="url(#chair-fabric)" />
      {/* Arms and seat. */}
      <rect x="4" y="23" width="9" height="18" rx="4.5" fill="#d8a77c" />
      <rect x="36" y="23" width="9" height="18" rx="4.5" fill="#d8a77c" />
      <rect x="10" y="31" width="29" height="10" rx="4" fill="#e9c7a2" />
      {/* A cushion, tossed on at an angle. */}
      <rect x="17" y="20" width="13" height="11" rx="3" fill="#6f93cf" transform="rotate(-12 23.5 25.5)" />
      <path d="M19 22 L28 29" stroke="#ffffff" strokeWidth="0.7" opacity="0.5" transform="rotate(-12 23.5 25.5)" />
      {/* A moving box at the chair's foot, flaps up, still not unpacked. */}
      <g className="fx-hop">
        <path d="M18 43 l-4 -4 l6 0 Z" fill="#c99a5f" />
        <path d="M34 43 l4 -4 l-6 0 Z" fill="#c99a5f" />
        <rect x="18" y="43" width="16" height="11" rx="0.8" fill="#d9ab6f" />
        <rect x="18" y="43" width="16" height="2.2" fill="#c99a5f" />
        <rect x="24.5" y="43" width="3" height="11" fill="#ead2a8" opacity="0.8" />
      </g>
      </g>
    </svg>
  )
}

/**
 * An easel with a canvas on it, a brush laying down colour: one stroke after
 * another fills the canvas, then it starts over, like a fresh canvas.
 */
function EaselIcon() {
  return (
    <svg viewBox="0 0 52 56" className="w-[46px] drop-shadow-[0_4px_6px_rgba(15,15,15,0.12)]">
      {/* The easel's legs and the ledge the canvas rests on. */}
      <path d="M26 4 L13 54" stroke="#9a6b43" strokeWidth="2.2" strokeLinecap="round" />
      <path d="M26 4 L39 54" stroke="#9a6b43" strokeWidth="2.2" strokeLinecap="round" />
      <path d="M26 4 L26 50" stroke="#7c5332" strokeWidth="1.8" strokeLinecap="round" />
      <rect x="9" y="38" width="34" height="2.6" rx="1.3" fill="#7c5332" />
      {/* The canvas. */}
      <rect x="11" y="9" width="30" height="29" rx="1" fill="#fbf8f1" stroke="#e4ddcf" strokeWidth="0.8" />
      {/* The painting, stroke by stroke: a sun, hills, a sky band. */}
      <path className="fx-paint fx-paint-1" pathLength={1} d="M15 16 C 21 13, 31 19, 37 15" fill="none" stroke="#9cc0e8" strokeWidth="3.2" strokeLinecap="round" />
      <circle className="fx-paint-dot" cx="31" cy="22" r="3.6" fill="#f2b84b" />
      <path className="fx-paint fx-paint-2" pathLength={1} d="M14 33 C 19 25, 24 25, 28 31 S 35 27, 38 30" fill="none" stroke="#5fa06b" strokeWidth="3.4" strokeLinecap="round" />
      <path className="fx-paint fx-paint-3" pathLength={1} d="M15 35.5 H 37" fill="none" stroke="#e0533d" strokeWidth="2" strokeLinecap="round" />
      {/* The brush, tipped in paint, moving over the canvas. */}
      <g className="fx-brush">
        <path d="M44 6 L35 20" stroke="#3a3a38" strokeWidth="1.6" strokeLinecap="round" />
        <path d="M35 20 L33.6 22.6" stroke="#e0533d" strokeWidth="2.4" strokeLinecap="round" />
      </g>
    </svg>
  )
}

/** A Portuguese azulejo: a blue-and-white tile. */
function TileIcon() {
  return (
    <svg viewBox="0 0 48 48" className="w-11 drop-shadow-[0_4px_6px_rgba(15,15,15,0.12)]">
      <rect x="2" y="2" width="44" height="44" rx="3" fill="#f7f5ef" />
      <rect x="2" y="2" width="44" height="44" rx="3" fill="none" stroke="#2c56a0" strokeWidth="2" />
      {/* Corner quarter-circles, which join into circles across tiles. */}
      {[
        [2, 2],
        [46, 2],
        [2, 46],
        [46, 46],
      ].map(([x, y]) => (
        <circle key={`${x}-${y}`} cx={x} cy={y} r="9" fill="none" stroke="#2c56a0" strokeWidth="2.4" clipPath="url(#tile-clip)" />
      ))}
      <clipPath id="tile-clip">
        <rect x="2" y="2" width="44" height="44" rx="3" />
      </clipPath>
      {/* The centre flower blooms: the big petals open out from the middle,
          the small ones follow, it holds, then closes back to a bud. */}
      <g className="fx-bloom">
        {[0, 90, 180, 270].map((a) => (
          <ellipse key={a} cx="24" cy="15.5" rx="3.6" ry="7" fill="#2c56a0" transform={`rotate(${a} 24 24)`} />
        ))}
      </g>
      <g className="fx-bloom fx-bloom-late">
        {[45, 135, 225, 315].map((a) => (
          <ellipse key={a} cx="24" cy="17" rx="2" ry="4.5" fill="#6f93cf" transform={`rotate(${a} 24 24)`} />
        ))}
      </g>
      <circle cx="24" cy="24" r="3.2" fill="#f2c46d" stroke="#2c56a0" strokeWidth="1" />
    </svg>
  )
}
