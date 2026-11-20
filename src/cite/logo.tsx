import { useState, type CSSProperties } from "react"

const faviconUrl = (domain: string) =>
  `https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=64`

/**
 * A company's mark: its favicon, or its first letter on a quiet grey square
 * when there is no domain or the image fails to load.
 */
export function Logo({
  domain,
  name,
  size = 16,
  className,
  style,
}: {
  domain?: string
  name?: string
  size?: number
  className?: string
  style?: CSSProperties
}) {
  /* Keyed on the domain, so a new domain gets a fresh attempt. */
  const [failedFor, setFailedFor] = useState<string | null>(null)
  const label = name ?? domain ?? "?"
  const box: CSSProperties = {
    width: size,
    height: size,
    borderRadius: Math.max(2, Math.round(size * 0.22)),
    ...style,
  }

  if (!domain || failedFor === domain) {
    return (
      <span
        role="img"
        aria-label={label}
        title={label}
        className={`inline-flex shrink-0 select-none items-center justify-center bg-[#ecedee] font-semibold text-[rgb(90,100,116)] ${className ?? ""}`}
        style={{ ...box, fontSize: Math.max(6, Math.round(size * 0.55)), lineHeight: 1 }}
      >
        {label.trim().charAt(0).toUpperCase() || "?"}
      </span>
    )
  }

  return (
    <img
      src={faviconUrl(domain)}
      alt={label}
      title={label}
      width={size}
      height={size}
      loading="lazy"
      decoding="async"
      referrerPolicy="no-referrer"
      onError={() => setFailedFor(domain)}
      className={`inline-block shrink-0 object-contain align-middle ${className ?? ""}`}
      style={box}
    />
  )
}
