import { CitationCard } from "./cite/citation-card"
import type { Citation } from "./cite/citation"
import { agentComputed, countedAccounts, namedAccount, pipelineCreated, quotedActivity } from "./cite/fixtures"
import { Scaled } from "./report-kit"

/*
 * The Citations case study's hero: one citation card in the centre, and two
 * on either side cascading back from it. Every card faces forward; each step
 * out is smaller, further back and fainter than the last, and the cards get
 * shorter the further back they sit, so none outgrows the centre. Laid out on
 * a fixed stage and scaled to the page, so it keeps its shape at every width.
 */

/** The stage's design size. */
const STAGE_W = 1100
const STAGE_H = 470

/** Where each card sits, from the centre outward. */
const STEPS = [
  { x: 0, scale: 1, opacity: 1 },
  { x: 240, scale: 0.86, opacity: 0.55 },
  { x: 380, scale: 0.72, opacity: 0.25 },
]

function Card({
  citation,
  step,
  side,
  order,
}: {
  citation: Citation
  step: (typeof STEPS)[number]
  /** -1 left of centre, 1 right of it, 0 the centre. */
  side: -1 | 0 | 1
  /** Arrival order: the centre first, then outward. */
  order: number
}) {
  return (
    <div
      className="cascade-card absolute top-1/2 left-1/2"
      style={{
        // Centred on the stage's middle line, then stepped out to the side and
        // drawn smaller: further back, but still facing forward.
        transform: `translate(-50%, -50%) translateX(${side * step.x}px) scale(${step.scale})`,
        zIndex: 10 - order,
        animationDelay: `${150 + order * 110}ms`,
      }}
    >
      {/* Only the centre card keeps its button, so each card behind it is
          shorter than the one in front. */}
      <CitationCard citation={citation} audience="in-app" detail="full" hideCta={side !== 0} />
      {/* The fade: a veil in the panel's colour laid over the card, rather
          than the card made see-through. The card stays solid, so it hides
          whatever sits behind it, and still reads as faded into the panel. */}
      {step.opacity < 1 && (
        <span
          aria-hidden
          className="pointer-events-none absolute inset-0 rounded-[8px]"
          style={{ background: "var(--bar)", opacity: 1 - step.opacity }}
        />
      )}
    </div>
  )
}

export function CitationsCascade() {
  return (
    <div inert aria-hidden className="case-media cascade-frame relative overflow-hidden">
      <Scaled width={STAGE_W}>
        <div className="relative" style={{ height: STAGE_H }}>
          {/* Furthest back first, so the nearer cards paint over them. The
              shortest cards sit at the back. */}
          <Card citation={agentComputed} step={STEPS[2]!} side={-1} order={4} />
          <Card citation={namedAccount} step={STEPS[2]!} side={1} order={3} />
          <Card citation={countedAccounts} step={STEPS[1]!} side={-1} order={2} />
          <Card citation={quotedActivity} step={STEPS[1]!} side={1} order={1} />
          <Card citation={pipelineCreated} step={STEPS[0]!} side={0} order={0} />
        </div>
      </Scaled>
    </div>
  )
}
