import { OBSERVATORY } from './constants'

/** Julian Date from a JavaScript Date */
export function getJulianDate(date: Date = new Date()): number {
  return date.getTime() / 86400000 + 2440587.5
}

/** Local Sidereal Time in hours */
export function getLocalSiderealTime(date: Date = new Date(), lon = OBSERVATORY.lon): number {
  const JD = getJulianDate(date)
  const T = (JD - 2451545.0) / 36525.0
  let GMST =
    280.46061837 +
    360.98564736629 * (JD - 2451545.0) +
    0.000387933 * T * T -
    (T * T * T) / 38710000.0
  GMST = ((GMST % 360) + 360) % 360
  const LST = ((GMST + lon) % 360 + 360) % 360
  return LST / 15.0
}

/** Format sidereal time as hhʰmmᵐssˢ */
export function formatSiderealTime(lst: number): string {
  const total = ((lst % 24) + 24) % 24
  const h = Math.floor(total)
  const mTotal = (total - h) * 60
  const m = Math.floor(mTotal)
  const s = Math.floor((mTotal - m) * 60)
  return `${h.toString().padStart(2, '0')}ʰ${m.toString().padStart(2, '0')}ᵐ${s.toString().padStart(2, '0')}ˢ`
}

/** Julian Date as formatted string */
export function formatJulianDate(date: Date = new Date()): string {
  return getJulianDate(date).toFixed(5)
}

/** Moon phase from astronomy-engine — returns 0-1 (0=new, 0.5=full) */
export async function getMoonPhase(date: Date = new Date()): Promise<number> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const mod = await import('astronomy-engine')
    const Astronomy = (mod as any).default ?? mod
    const degrees = Astronomy.MoonPhase(date) as number
    return degrees / 360
  } catch {
    return 0
  }
}

/** Moon phase name in Korean */
export function getMoonPhaseName(phase: number): string {
  const p = ((phase % 1) + 1) % 1
  if (p < 0.03 || p > 0.97) return '삭 (신월)'
  if (p < 0.22) return '초승달'
  if (p < 0.28) return '상현달'
  if (p < 0.47) return '상현 ~ 망'
  if (p < 0.53) return '망 (보름달)'
  if (p < 0.72) return '망 ~ 하현'
  if (p < 0.78) return '하현달'
  return '그믐달'
}

/** Observation status from cloud cover & visibility */
export function getObservationStatus(clouds: number, visibility: number) {
  if (clouds < 25 && visibility >= 8000) {
    return { status: '최적' as const, color: '#10b981', description: '맑고 시정 양호' }
  } else if (clouds < 60 && visibility >= 4000) {
    return { status: '보통' as const, color: '#f59e0b', description: '부분 운량' }
  } else {
    return { status: '불가' as const, color: '#ef4444', description: '운량 과다 또는 시정 불량' }
  }
}

/** Wind degree → Korean direction */
export function getWindDirection(deg: number): string {
  const dirs = [
    '북', '북북동', '북동', '동북동', '동', '동남동', '남동', '남남동',
    '남', '남남서', '남서', '서남서', '서', '서북서', '북서', '북북서',
  ]
  return dirs[Math.round(deg / 22.5) % 16]
}

/** Unix timestamp → HH:mm KST */
export function formatSunTime(unix: number): string {
  return new Date(unix * 1000).toLocaleTimeString('ko-KR', {
    timeZone: 'Asia/Seoul',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
}
