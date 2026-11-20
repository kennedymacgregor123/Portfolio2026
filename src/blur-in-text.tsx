import { Fragment } from "react"

/**
 * A run of text in the bio. `strong` runs are set bold and near-black.
 */
export type Run = { text: string; strong?: boolean }

/**
 * Text that arrives letter by letter: each character starts invisible,
 * blurred 10px and 10px low, then settles in, staggered across the whole
 * block. Words stay unbroken (each is a no-wrap group), so lines break exactly
 * as plain text would.
 *
 * `start` is the index the first character of this block takes in the overall
 * stagger, so several blocks can play as one sequence.
 */
export function BlurInText({
  runs,
  start = 0,
  className,
}: {
  runs: Run[]
  start?: number
  className?: string
}) {
  let i = start
  const label = runs.map((r) => r.text).join("")

  return (
    <p className={className} aria-label={label}>
      {runs.map((run, r) => {
        // Split into words and the spaces between them, keeping both.
        const parts = run.text.split(/(\s+)/)
        const content = parts.map((part, p) => {
          if (part === "") return null
          if (/^\s+$/.test(part)) {
            i += 1
            return <Fragment key={p}>{part}</Fragment>
          }
          return (
            <span key={p} className="whitespace-nowrap" aria-hidden>
              {[...part].map((ch, c) => (
                <span key={c} className="blur-in-char" style={{ "--i": i++ } as React.CSSProperties}>
                  {ch}
                </span>
              ))}
            </span>
          )
        })
        return run.strong ? (
          <strong key={r} className="about-strong">
            {content}
          </strong>
        ) : (
          <Fragment key={r}>{content}</Fragment>
        )
      })}
    </p>
  )
}

/** How many stagger steps a block of runs takes, to chain the next block. */
export function length(runs: Run[]) {
  return runs.reduce((n, r) => n + r.text.length, 0)
}
