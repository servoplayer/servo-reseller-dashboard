/** 0 plus 3–5 evenly spaced "round" ticks covering `max`. */
export function niceTicks(max) {
  if (!(max > 0)) return [0, 1]
  const raw = max / 4
  const pow = 10 ** Math.floor(Math.log10(raw))
  const step = [1, 2, 5, 10].map((m) => m * pow).find((s) => s >= raw)
  const top = step * Math.ceil(max / step)
  const ticks = []
  for (let v = 0; v <= top + step / 2; v += step) ticks.push(Math.round(v * 1e6) / 1e6)
  return ticks
}

const monthFmt = new Intl.DateTimeFormat(undefined, { month: 'short', timeZone: 'UTC' })
const monthYearFmt = new Intl.DateTimeFormat(undefined, { month: 'long', year: 'numeric', timeZone: 'UTC' })

/** "2026-05" -> { short: "May", long: "May 2026" } */
export function monthLabel(key) {
  const [y, m] = String(key).split('-').map(Number)
  if (!y || !m) return { short: String(key), long: String(key) }
  const date = new Date(Date.UTC(y, m - 1, 1))
  return { short: monthFmt.format(date), long: monthYearFmt.format(date) }
}
