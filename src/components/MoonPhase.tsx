interface Props {
  phase: number // 0–1  (0 = new moon, 0.5 = full moon)
  size?: number
}

function getMoonPath(phase: number, r: number): string {
  const cx = r
  const cy = r
  const p = ((phase % 1) + 1) % 1

  if (p < 0.01 || p > 0.99) return '' // new moon — no lit area
  if (Math.abs(p - 0.5) < 0.01) {
    // full moon
    return `M ${cx},${cy - r} A ${r},${r} 0 1 1 ${cx},${cy + r} A ${r},${r} 0 1 1 ${cx},${cy - r} Z`
  }

  const isWaxing = p < 0.5
  const termRx = Math.abs(r * Math.cos(p * 2 * Math.PI))

  if (isWaxing) {
    // lit on right
    const sweep = p < 0.25 ? 0 : 1
    return `M ${cx},${cy - r} A ${r},${r} 0 0 1 ${cx},${cy + r} A ${termRx},${r} 0 0 ${sweep} ${cx},${cy - r} Z`
  } else {
    // lit on left
    const sweep = p < 0.75 ? 1 : 0
    return `M ${cx},${cy - r} A ${r},${r} 0 0 0 ${cx},${cy + r} A ${termRx},${r} 0 0 ${sweep} ${cx},${cy - r} Z`
  }
}

export default function MoonPhase({ phase, size = 48 }: Props) {
  const r = size / 2 - 1
  const path = getMoonPath(phase, r)

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      aria-label="달 위상"
    >
      {/* Dark background */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="#0f172a"
        stroke="rgba(255,255,255,0.15)"
        strokeWidth="0.8"
      />
      {/* Lit portion */}
      {path && (
        <path
          d={path}
          fill="#fef08a"
          opacity="0.88"
          transform={`translate(${size / 2 - r}, ${size / 2 - r})`}
        />
      )}
      {/* Outer glow ring */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke="rgba(254,240,138,0.12)"
        strokeWidth="1"
      />
    </svg>
  )
}
