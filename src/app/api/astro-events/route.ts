import { NextResponse } from 'next/server'
import { parseStringPromise } from 'xml2js'

const BASE_URL =
  'https://apis.data.go.kr/B090041/openapi/service/AstroEventInfoService'
const API_KEY = process.env.OPEN_API_KEY

export interface AstroEventItem {
  locdate: string
  seq: string
  astroEvent: string
  astroTime: string
  astroTitle: string
}

// 데모 데이터 (API 키 없을 때)
function getDemoEvents(): AstroEventItem[] {
  const now = new Date(Date.now() + 9 * 60 * 60 * 1000)
  const y = now.getUTCFullYear()
  const m = String(now.getUTCMonth() + 1).padStart(2, '0')
  return [
    { locdate: `${y}${m}05`, seq: '1', astroEvent: '달-목성 근접 (데모)', astroTime: '21:30', astroTitle: '' },
    { locdate: `${y}${m}10`, seq: '2', astroEvent: '상현달', astroTime: '03:12', astroTitle: '' },
    { locdate: `${y}${m}12`, seq: '3', astroEvent: '수성 동방최대이각', astroTime: '00:00', astroTitle: '' },
    { locdate: `${y}${m}18`, seq: '4', astroEvent: '보름달(망)', astroTime: '11:22', astroTitle: '' },
    { locdate: `${y}${m}20`, seq: '5', astroEvent: '달-토성 근접', astroTime: '20:00', astroTitle: '' },
    { locdate: `${y}${m}25`, seq: '6', astroEvent: '하현달', astroTime: '19:45', astroTitle: '' },
  ]
}

async function fetchAstroEvents(
  year: string,
  month: string,
): Promise<AstroEventItem[]> {
  const query = new URLSearchParams({
    solYear: year,
    solMonth: month,
    numOfRows: '100',
    ServiceKey: API_KEY!,
  })
  const url = `${BASE_URL}/getAstroEventInfo?${query.toString()}`
  const res = await fetch(url, { next: { revalidate: 3600 * 6 } })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const xml = await res.text()
  const parsed = await parseStringPromise(xml, { explicitArray: false })
  const header = parsed.response?.header
  if (header?.resultCode !== '00')
    throw new Error(`API ${header?.resultCode}: ${header?.resultMsg}`)
  const rawItems = parsed.response?.body?.items?.item
  if (!rawItems) return []
  const arr = Array.isArray(rawItems) ? rawItems : [rawItems]
  return arr.map((i: Record<string, string>) => ({
    locdate: (i.locdate ?? '').trim(),
    seq: i.seq ?? '',
    astroEvent: i.astroEvent ?? '',
    astroTime: i.astroTime ?? '',
    astroTitle: i.astroTitle ?? '',
  }))
}

export async function GET() {
  const now = new Date(Date.now() + 9 * 60 * 60 * 1000) // KST
  const year = String(now.getUTCFullYear())
  const month = String(now.getUTCMonth() + 1).padStart(2, '0')

  if (!API_KEY) {
    return NextResponse.json({ year, month, items: getDemoEvents() })
  }

  try {
    const items = await fetchAstroEvents(year, month)
    return NextResponse.json({ year, month, items })
  } catch (e) {
    return NextResponse.json(
      { error: String(e), items: getDemoEvents() },
      { status: 200 },
    )
  }
}
