export type View = "about" | "work"

const OPTIONS: { value: View; label: string }[] = [
  { value: "work", label: "Work" },
  { value: "about", label: "About" },
]

/**
 * A two-way switch between the Work and About views: the active option sits
 * on a soft grey pill and the other is plain text. Arrow keys move between the
 * options, as a radio group does.
 */
export function ViewSwitch({
  view,
  onChange,
}: {
  view: View
  onChange: (view: View) => void
}) {
  return (
    <nav
      aria-label="Page"
      className="view-switch flex gap-0.5"
    >
      {OPTIONS.map((o) => {
        const active = o.value === view
        return (
          <button
            key={o.value}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(o.value)}
            onKeyDown={(e) => {
              // Left and right move between the two options; the page's own
              // arrow-key carousel controls are skipped while the switch has
              // focus.
              if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
                e.stopPropagation()
                const next = OPTIONS[(OPTIONS.indexOf(o) + 1) % OPTIONS.length]!
                onChange(next.value)
                ;(e.currentTarget.parentElement?.querySelector(
                  `[data-view="${next.value}"]`,
                ) as HTMLElement | null)?.focus()
              }
            }}
            data-view={o.value}
            className={`rounded-[8px] px-2.5 py-1 text-[13px] tracking-[0.2px] transition-colors duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] focus-visible:outline-1 focus-visible:outline-offset-1 focus-visible:outline-[#0f0f0f]/40 ${
              active
                ? "bg-[#e6e6e3] font-medium text-[#0f0f0f]"
                : "text-[#7a7a77] hover:text-[#0f0f0f]"
            }`}
          >
            {o.label}
          </button>
        )
      })}
    </nav>
  )
}
