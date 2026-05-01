import { NextResponse } from 'next/server'
import { OBSERVATORY } from '@/lib/constants'
import {
  latLonToGrid,
  fetchVilageFcst,
  skyToPercent,
  weatherDescription,
} from '@/lib/kmaApi'

const API_KEY = process.env.OPEN_API_KEY

function makeDemoForecast() {
  const now = Math.floor(Date.now() / 1000)
  return Array.from({ length: 8 }, (_, i) => ({
    dt:          now + i * 3 * 3600,
    temp:        14 + Math.sin(i * 0.8) * 5,
    clouds:      [15, 20, 35, 50, 40, 25, 18, 12][i],
    pop:         [0.05, 0.1, 0.2, 0.3, 0.15, 0.05, 0.02, 0.02][i],
    windSpeed:   2 + Math.random() * 2,
    humidity:    55 + i * 2,
    description: '맑음 (데모)',
  }))
}

export async function GET() {
  if (!API_KEY) {
    return NextResponse.json(makeDemoForecast())
  }

  try {
    const { nx, ny } = latLonToGrid(OBSERVATORY.lat, OBSERVATORY.lon)
    const hourlyItems = await fetchVilageFcst(nx, ny, API_KEY)

    // 현재 KST 이후 최대 48시간치 추출
    const kst      = new Date(Date.now() + 9 * 60 * 60 * 1000)
    const todayStr = `${kst.getUTCFullYear()}${String(kst.getUTCMonth() + 1).padStart(2, '0')}${String(kst.getUTCDate()).padStart(2, '0')}`
    const nowHHMM  = String(kst.getUTCHours()).padStart(2, '0') + '00'

    const forecast = hourlyItems
      .filter(item => {
        if (item.fcstDate > todayStr) return true
        return item.fcstDate === todayStr && item.fcstTime >= nowHHMM
      })
      .slice(0, 48)
      .map(item => {
        const year = parseInt(item.fcstDate.slice(0, 4), 10)
        const mon  = parseInt(item.fcstDate.slice(4, 6), 10) - 1
        const day  = parseInt(item.fcstDate.slice(6, 8), 10)
        const hr   = parseInt(item.fcstTime.slice(0, 2), 10)
        // KST fcstTime → UTC Unix timestamp
        const dt   = Math.floor(Date.UTC(year, mon, day, hr, 0, 0) / 1000) - 9 * 3600

        const rain =
          (item.PTY === '1' || item.PTY === '4') &&
          item.PCP !== '-' &&
          item.PCP !== '강수없음'
            ? { '3h': parseFloat(item.PCP) || 0 }
            : undefined

        const snow =
          (item.PTY === '2' || item.PTY === '3') &&
          item.SNO !== '-' &&
          item.SNO !== '적설없음'
            ? { '3h': parseFloat(item.SNO) || 0 }
            : undefined

        return {
          dt,
          temp:        parseFloat(item.TMP),
          clouds:      skyToPercent(item.SKY),
          pop:         parseInt(item.POP, 10) / 100,  // % → 0~1
          rain,
          snow,
          windSpeed:   parseFloat(item.WSD),
          humidity:    parseInt(item.REH, 10),
          description: weatherDescription(item.SKY, item.PTY),
        }
      })

    return NextResponse.json(forecast)
  } catch (e) {
    console.error('[forecast API]', e)
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
