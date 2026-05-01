/**
 * 한국기상청(KMA) / 한국천문연구원(KASI) OpenAPI 유틸리티
 *
 * - 단기예보 (getVilageFcst)  : 기온·운량·강수·풍향·풍속 등
 * - 위치별 해달 출몰시각 (getLCRiseSetInfo) : 일출·일몰 (Unix timestamp 변환)
 * - 월령 정보 (getLunPhInfo) : 달 위상 0~1
 */

import { parseStringPromise } from 'xml2js'

// ─── Lambert 도법 격자 변환 ─────────────────────────────────────

const RE     = 6371.00877  // 지구 반경 (km)
const GRID   = 5.0         // 격자 간격 (km)
const SLAT1  = 30.0        // 표준 위도 1 (도)
const SLAT2  = 60.0        // 표준 위도 2 (도)
const OLON   = 126.0       // 기준 경도 (도)
const OLAT   = 38.0        // 기준 위도 (도)
const XO     = 43          // 기준점 X 격자
const YO     = 136         // 기준점 Y 격자
const DEGRAD = Math.PI / 180

/** 위도/경도 → KMA 격자 좌표 (nx, ny) 변환 (Lambert 정형원통 도법) */
export function latLonToGrid(lat: number, lon: number): { nx: number; ny: number } {
  const re    = RE / GRID
  const slat1 = SLAT1 * DEGRAD
  const slat2 = SLAT2 * DEGRAD
  const olon  = OLON * DEGRAD
  const olat  = OLAT * DEGRAD

  let sn = Math.tan(Math.PI * 0.25 + slat2 * 0.5) / Math.tan(Math.PI * 0.25 + slat1 * 0.5)
  sn = Math.log(Math.cos(slat1) / Math.cos(slat2)) / Math.log(sn)

  let sf = Math.tan(Math.PI * 0.25 + slat1 * 0.5)
  sf = (Math.pow(sf, sn) * Math.cos(slat1)) / sn

  let ro = Math.tan(Math.PI * 0.25 + olat * 0.5)
  ro = (re * sf) / Math.pow(ro, sn)

  let ra = Math.tan(Math.PI * 0.25 + lat * DEGRAD * 0.5)
  ra = (re * sf) / Math.pow(ra, sn)

  let theta = lon * DEGRAD - olon
  if (theta > Math.PI) theta -= 2.0 * Math.PI
  if (theta < -Math.PI) theta += 2.0 * Math.PI
  theta *= sn

  const nx = Math.floor(ra * Math.sin(theta) + XO + 0.5)
  const ny = Math.floor(ro - ra * Math.cos(theta) + YO + 0.5)
  return { nx, ny }
}

// ─── KST 날짜/시간 유틸 ────────────────────────────────────────

/** 현재 KST 날짜 문자열 반환 (YYYYMMDD) */
export function kstDateStr(date = new Date()): string {
  const kst  = new Date(date.getTime() + 9 * 60 * 60 * 1000)
  const yyyy = kst.getUTCFullYear()
  const mo   = String(kst.getUTCMonth() + 1).padStart(2, '0')
  const dd   = String(kst.getUTCDate()).padStart(2, '0')
  return `${yyyy}${mo}${dd}`
}

/** 현재 KST 년/월 반환 */
export function kstYearMonth(date = new Date()): { year: string; month: string } {
  const kst = new Date(date.getTime() + 9 * 60 * 60 * 1000)
  return {
    year:  String(kst.getUTCFullYear()),
    month: String(kst.getUTCMonth() + 1).padStart(2, '0'),
  }
}

/** 현재 KST 시각 HHMM 반환 */
export function kstHHMM(date = new Date()): string {
  const kst = new Date(date.getTime() + 9 * 60 * 60 * 1000)
  return (
    String(kst.getUTCHours()).padStart(2, '0') +
    String(kst.getUTCMinutes()).padStart(2, '0')
  )
}

/** 현재 KST 기준 가장 최근 단기예보 발표 시각 반환 */
export function getLatestBaseTime(date = new Date()): { base_date: string; base_time: string } {
  const kst  = new Date(date.getTime() + 9 * 60 * 60 * 1000)
  const hh   = kst.getUTCHours()
  const mm   = kst.getUTCMinutes()
  const slots = [2, 5, 8, 11, 14, 17, 20, 23]
  const nowH  = hh + mm / 60

  let chosenH = slots[0]
  for (const s of slots) {
    if (s + 10 / 60 <= nowH) chosenH = s
  }

  let refDate = kst
  if (hh < 2 || (hh === 2 && mm < 10)) {
    chosenH = 23
    refDate  = new Date(kst.getTime() - 24 * 60 * 60 * 1000)
  }

  const yyyy = refDate.getUTCFullYear()
  const mo   = String(refDate.getUTCMonth() + 1).padStart(2, '0')
  const dd   = String(refDate.getUTCDate()).padStart(2, '0')
  return {
    base_date: `${yyyy}${mo}${dd}`,
    base_time: String(chosenH).padStart(2, '0') + '00',
  }
}

// ─── 기상 코드 변환 유틸 ───────────────────────────────────────

/** SKY 코드 → 운량 (%) */
export function skyToPercent(sky: string): number {
  if (sky === '1') return 5
  if (sky === '3') return 65
  if (sky === '4') return 90
  return 30
}

/** SKY + PTY 코드 → 한글 기상 설명 */
export function weatherDescription(sky: string, pty: string): string {
  const ptyMap: Record<string, string> = {
    '1': '비', '2': '비/눈', '3': '눈', '4': '소나기',
  }
  if (pty && pty !== '0' && ptyMap[pty]) return ptyMap[pty]
  const skyMap: Record<string, string> = {
    '1': '맑음', '3': '구름많음', '4': '흐림',
  }
  return skyMap[sky] ?? '알 수 없음'
}

/** SKY + PTY → icon 코드 (OpenWeatherMap 호환 스타일) */
export function weatherIcon(sky: string, pty: string, isNight: boolean): string {
  const s = isNight ? 'n' : 'd'
  if (pty === '1' || pty === '4') return `10${s}`  // 비/소나기
  if (pty === '2' || pty === '3') return `13${s}`  // 비/눈, 눈
  if (sky === '1') return `01${s}`                 // 맑음
  if (sky === '3') return `03${s}`                 // 구름많음
  if (sky === '4') return `04${s}`                 // 흐림
  return `02${s}`
}

/** 체감온도 (풍속에 따른 wind chill, WMO 공식) */
export function windChill(temp: number, windSpeed: number): number {
  if (temp > 10 || windSpeed <= 1.3) return Math.round(temp * 10) / 10
  return (
    Math.round(
      (13.12 +
        0.6215 * temp -
        11.37 * Math.pow(windSpeed, 0.16) +
        0.3965 * temp * Math.pow(windSpeed, 0.16)) *
        10,
    ) / 10
  )
}

/** HHMMSS 또는 HHMM(KST) + YYYYMMDD → Unix timestamp (초)
 *  KASI API가 빈 문자열이나 4자리(HHMM)를 반환하는 경우도 처리 */
export function riseSetToUnix(hhmmss: string, yyyymmdd: string): number | null {
  if (!hhmmss || hhmmss.length < 4) return null
  const year  = parseInt(yyyymmdd.slice(0, 4), 10)
  const month = parseInt(yyyymmdd.slice(4, 6), 10) - 1
  const day   = parseInt(yyyymmdd.slice(6, 8), 10)
  const hh    = parseInt(hhmmss.slice(0, 2), 10)
  const mm    = parseInt(hhmmss.slice(2, 4), 10)
  const ss    = hhmmss.length >= 6 ? parseInt(hhmmss.slice(4, 6), 10) : 0
  if (isNaN(hh) || isNaN(mm) || isNaN(ss)) return null
  // KST(+9h) → UTC
  const ts = Math.floor(Date.UTC(year, month, day, hh, mm, ss) / 1000) - 9 * 3600
  return isNaN(ts) ? null : ts
}

// ─── API 엔드포인트 ────────────────────────────────────────────

const FCST_BASE    = 'https://apis.data.go.kr/1360000/VilageFcstInfoService_2.0'
const RISESET_BASE = 'https://apis.data.go.kr/B090041/openapi/service/RiseSetInfoService'
const LUNPH_BASE   = 'https://apis.data.go.kr/B090041/openapi/service/LunPhInfoService'

// ─── 단기예보 (getVilageFcst) ─────────────────────────────────

export interface HourlyFcst {
  fcstDate: string   // YYYYMMDD
  fcstTime: string   // HHMM
  TMP:  string       // 기온 (℃)
  SKY:  string       // 하늘상태 코드
  PTY:  string       // 강수형태 코드
  POP:  string       // 강수확률 (%)
  REH:  string       // 습도 (%)
  WSD:  string       // 풍속 (m/s)
  VEC:  string       // 풍향 (deg)
  PCP:  string       // 1시간 강수량
  SNO:  string       // 1시간 신적설
}

/** 기상청 단기예보 조회 → 시간별 피벗 배열 반환 */
export async function fetchVilageFcst(
  nx: number,
  ny: number,
  serviceKey: string,
): Promise<HourlyFcst[]> {
  const { base_date, base_time } = getLatestBaseTime()
  const query = new URLSearchParams({
    serviceKey,
    numOfRows: '1000',
    pageNo:    '1',
    dataType:  'XML',
    base_date,
    base_time,
    nx:        String(nx),
    ny:        String(ny),
  })
  const url = `${FCST_BASE}/getVilageFcst?${query}`
  const res = await fetch(url, { next: { revalidate: 1800 } })
  if (!res.ok) throw new Error(`KMA forecast HTTP ${res.status}`)

  const xml    = await res.text()
  const parsed = await parseStringPromise(xml, { explicitArray: false })
  const header = parsed.response?.header
  if (header?.resultCode !== '00') {
    throw new Error(`KMA 단기예보: [${header?.resultCode}] ${header?.resultMsg}`)
  }

  const rawItems = parsed.response?.body?.items?.item
  if (!rawItems) return []

  const arr  = Array.isArray(rawItems) ? rawItems : [rawItems]
  const map  = new Map<string, Record<string, string>>()

  for (const item of arr) {
    const key = `${item.fcstDate}_${item.fcstTime}`
    if (!map.has(key)) map.set(key, { fcstDate: item.fcstDate, fcstTime: item.fcstTime })
    map.get(key)![item.category] = item.fcstValue
  }

  return Array.from(map.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([, v]) => ({
      fcstDate: v.fcstDate ?? '',
      fcstTime: v.fcstTime ?? '',
      TMP:  v.TMP  ?? '-',
      SKY:  v.SKY  ?? '-',
      PTY:  v.PTY  ?? '-',
      POP:  v.POP  ?? '-',
      REH:  v.REH  ?? '-',
      WSD:  v.WSD  ?? '-',
      VEC:  v.VEC  ?? '-',
      PCP:  v.PCP  ?? '-',
      SNO:  v.SNO  ?? '-',
    }))
}

/** 현재 KST 시각과 가장 가까운 예보 슬롯 반환 */
export function findCurrentSlot(items: HourlyFcst[]): HourlyFcst | null {
  if (items.length === 0) return null
  const kst       = new Date(Date.now() + 9 * 60 * 60 * 1000)
  const todayStr  = `${kst.getUTCFullYear()}${String(kst.getUTCMonth() + 1).padStart(2, '0')}${String(kst.getUTCDate()).padStart(2, '0')}`
  const nowHHMM   = String(kst.getUTCHours()).padStart(2, '0') + '00'

  const todayItems = items.filter(i => i.fcstDate === todayStr)
  const pool       = todayItems.length > 0 ? todayItems : items

  let found = pool[0]
  for (const item of pool) {
    if (item.fcstTime <= nowHHMM) found = item
    else break
  }
  return found
}

// ─── 위치별 해달 출몰시각 (getLCRiseSetInfo) ─────────────────

export interface RiseSetResult {
  sunrise:  string   // HHMMSS
  sunset:   string   // HHMMSS
  moonrise: string   // HHMMSS (없으면 빈 문자열)
  moonset:  string   // HHMMSS (없으면 빈 문자열)
  astm:     string   // 천문박명(아침)
  aste:     string   // 천문박명(저녁)
}

/** 위치별 해달 출몰시각 조회 */
export async function fetchRiseSet(
  lat: number,
  lon: number,
  serviceKey: string,
  date = new Date(),
): Promise<RiseSetResult> {
  const locdate = kstDateStr(date)
  const query = new URLSearchParams({
    locdate,
    longitude:  String(lon),
    latitude:   String(lat),
    dnYn:       'Y',
    ServiceKey: serviceKey,
  })
  const url = `${RISESET_BASE}/getLCRiseSetInfo?${query}`
  const res = await fetch(url, { next: { revalidate: 3600 * 6 } })
  if (!res.ok) throw new Error(`KMA 출몰시각 HTTP ${res.status}`)

  const xml    = await res.text()
  const parsed = await parseStringPromise(xml, { explicitArray: false })
  const header = parsed.response?.header
  if (header?.resultCode !== '00') {
    throw new Error(`KMA 출몰시각: [${header?.resultCode}] ${header?.resultMsg}`)
  }

  const item  = parsed.response?.body?.items?.item
  const first = Array.isArray(item) ? item[0] : item
  return {
    sunrise:  first?.sunrise  || '060000',
    sunset:   first?.sunset   || '190000',
    moonrise: first?.moonrise || '',
    moonset:  first?.moonset  || '',
    astm:     first?.astm     || '',
    aste:     first?.aste     || '',
  }
}

// ─── 월령 정보 (getLunPhInfo) ─────────────────────────────────

/** 오늘 날짜의 달 위상을 0~1 로 반환 (0=신월, 0.5=보름달) */
export async function fetchMoonPhase(serviceKey: string, date = new Date()): Promise<number> {
  const { year, month } = kstYearMonth(date)
  const kst      = new Date(date.getTime() + 9 * 60 * 60 * 1000)
  const todayDay = String(kst.getUTCDate()).padStart(2, '0')

  const query = new URLSearchParams({
    solYear:    year,
    solMonth:   month,
    ServiceKey: serviceKey,
  })
  const url = `${LUNPH_BASE}/getLunPhInfo?${query}`
  const res = await fetch(url, { next: { revalidate: 3600 * 12 } })
  if (!res.ok) throw new Error(`KMA 월령 HTTP ${res.status}`)

  const xml    = await res.text()
  const parsed = await parseStringPromise(xml, { explicitArray: false })
  const header = parsed.response?.header
  if (header?.resultCode !== '00') {
    throw new Error(`KMA 월령: [${header?.resultCode}] ${header?.resultMsg}`)
  }

  const rawItems = parsed.response?.body?.items?.item
  if (!rawItems) return 0

  const arr   = Array.isArray(rawItems) ? rawItems : [rawItems]
  const today = arr.find((i: Record<string, string>) => i.solDay === todayDay) ?? arr[0]
  const age   = parseFloat(today?.lunAge ?? '0')
  return isNaN(age) ? 0 : Math.min(age / 29.5, 1)
}
