/** The card's palette and spacing, as plain values. No theme is assumed. */

export const INK = "rgb(31,37,45)"
export const MUTED = "rgb(90,100,116)"
export const SUBTLE = "rgb(151,159,174)"
export const GLYPH = "rgba(31,37,45,0.72)"
export const HAIRLINE = "#ecedee"
export const BORDER = "#dadde2"
export const CARD_EDGE = "rgba(218,221,226,0.6)"
export const HIGHLIGHT = "#eef0f3"

export const FONT = '"Inter Variable", Inter, sans-serif'

/** Vertical steps between bands, in px. */
export const SPACE = { pair: 4, tight: 8, band: 14, section: 20 } as const

/** Joins class names, dropping falsy ones. */
export function cx(...parts: (string | false | null | undefined)[]): string {
  return parts.filter(Boolean).join(" ")
}
