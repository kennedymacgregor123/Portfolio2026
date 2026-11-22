/**
 * A closing quotation mark (the "99" shape), drawn rather than taken from an
 * icon set: two solid drops, each a round head with a tail curling down to
 * the left, as a printed quote is set. Fills with the current text colour.
 */
export function QuoteMark({ className, style }: { className?: string; style?: React.CSSProperties }) {
  // One drop: a round head (centre 7,8.5, radius 3.5) whose right side runs
  // down into a tapering tail that ends below and left of the head.
  const drop = "M3.5 8.5a3.5 3.5 0 1 1 7 0c0 4.6-2.6 7.9-6.1 9.2l-.7-1.3c1.9-1 3-2.5 3.3-4.4A3.5 3.5 0 0 1 3.5 8.5z"
  return (
    // Framed on the mark's visual centre (the heavy heads, not the tails'
    // tips), so it sits in the middle of a circle rather than high in it.
    <svg viewBox="2 1.5 21 17" fill="currentColor" aria-hidden className={className} style={style}>
      <path d={drop} />
      <path d={drop} transform="translate(10 0)" />
    </svg>
  )
}

/**
 * A person, to match: a solid round head over solid rounded shoulders, so it
 * sits beside a name with the same weight as the quote mark.
 */
export function PersonMark({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden className={className} style={style}>
      <circle cx="12" cy="7.5" r="4.5" />
      <path d="M3.5 21c0-4.4 3.8-7.5 8.5-7.5s8.5 3.1 8.5 7.5a1 1 0 0 1-1 1h-15a1 1 0 0 1-1-1z" />
    </svg>
  )
}
