/**
 * A citation, or a group of citations that back the same claim.
 *
 * A single citation renders as a plain card. A grouped one renders the card
 * for the current source, with a pager band on top: back and forward arrows
 * around "1 of 2", and opposite them one mark per source and a count.
 */
import { useState } from "react"
import { ChevronLeft, ChevronRight, type LucideIcon } from "lucide-react"

import { CitationCard, AttributionStack } from "./citation-card"
import { attributionOf, hasCard, type Audience, type Citation, type Detail } from "./citation"
import { MUTED } from "./tokens"

function StepButton({
  label,
  icon: Icon,
  disabled,
  onClick,
}: {
  label: string
  icon: LucideIcon
  disabled: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className="inline-flex size-[18px] shrink-0 cursor-pointer items-center justify-center rounded-[4px] bg-transparent p-0 transition-colors hover:bg-[#f1f2f4] hover:text-[rgb(31,37,45)] disabled:cursor-default disabled:opacity-25 disabled:hover:bg-transparent"
      style={{ color: MUTED }}
    >
      <Icon size={10} strokeWidth={2.75} />
    </button>
  )
}

export function CitationGroup({
  citation,
  audience = "in-app",
  detail = "full",
  showSlots,
  hideCta,
}: {
  citation: Citation
  audience?: Audience
  detail?: Detail
  showSlots?: boolean
  hideCta?: boolean
}) {
  /* Reset to the first source whenever a different citation comes in. */
  const [pos, setPos] = useState({ id: citation.id, index: 0 })

  const sources = (citation.group ? [citation, citation.group] : [citation]).filter((s) =>
    hasCard(s, audience),
  )
  const card = { audience, detail, showSlots, hideCta }

  if (sources.length === 0) return null
  if (sources.length === 1) return <CitationCard citation={sources[0]!} {...card} />

  const index = pos.id === citation.id ? Math.min(pos.index, sources.length - 1) : 0
  const go = (to: number) => setPos({ id: citation.id, index: to })

  const pager = (
    <span className="flex w-full items-center justify-between gap-3">
      <span className="-ml-[5px] flex shrink-0 items-center gap-0.5">
        <StepButton
          label="Previous source"
          icon={ChevronLeft}
          disabled={index === 0}
          onClick={() => go(index - 1)}
        />
        <span
          className="px-0.5 text-[11px] font-[450] tabular-nums"
          style={{ color: MUTED, letterSpacing: "0.3px" }}
        >
          {index + 1} of {sources.length}
        </span>
        <StepButton
          label="Next source"
          icon={ChevronRight}
          disabled={index === sources.length - 1}
          onClick={() => go(index + 1)}
        />
      </span>
      <span
        className="flex shrink-0 items-center gap-1.5 text-[11px] font-[450] leading-none"
        style={{ color: MUTED, letterSpacing: "0.3px" }}
      >
        <AttributionStack attributions={sources.map(attributionOf)} />
        {sources.length} sources
      </span>
    </span>
  )

  return <CitationCard citation={sources[index]!} {...card} pager={pager} />
}
