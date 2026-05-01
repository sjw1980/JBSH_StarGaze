import { NextResponse } from 'next/server'
import { OBSERVATORY } from '@/lib/constants'
import {
  latLonToGrid,
  fetchVilageFcst,
  findCurrentSlot,
  fetchRiseSet,
  fetchMoonPhase,
  kstDateStr,
  skyToPercent,
  weatherDescription,
  weatherIcon,
  windChill,
  riseSetToUnix,
} from '@/lib/kmaApi'

const API_KEY = process.env.OPEN_API_KEY

// API 키 없을 때 사용할 데모 데이터
const demoWeather = {
  temp: 14.6,
  feelsLike: 12.8,
  humidity: 58,
  windSpeed: 2.3,
  windDeg: 195,
  clouds: 15,
  visibility: 10000,
  description: '맑음 (데모)',
  icon: '01n',
  sunrise: Math.floor(Date.now() / 1000) - 3600 * 6,
  sunset: Math.floor(Date.now() / 1000) + 3600 * 3,
  moonPhase: 0.3,
}

export async function GET() {
  if (!API_KEY) {
    return NextResponse.json(demoWeather)
  }

  try {
    const { nx, ny } = latLonToGrid(OBSERVATORY.lat, OBSERVATORY.lon)
    const today      = kstDateStr()

    const [hourlyItems, riseSet, moonPhase] = await Promise.all([
      fetchVilageFcst(nx, ny, API_KEY),
      fetchRiseSet(OBSERVATORY.lat, OBSERVATORY.lon, API_KEY),
      fetchMoonPhase(API_KEY),
    ])

    const current = findCurrentSlot(hourlyItems)
    if (!current) throw new Error('예보 데이터 없음')

    const temp      = parseFloat(current.TMP)
    const windSpeed = parseFloat(current.WSD)
    const windDeg   = parseFloat(current.VEC)
    const humidity  = parseInt(current.REH, 10)
    const clouds    = skyToPercent(current.SKY)

    const kstNow  = new Date(Date.now() + 9 * 60 * 60 * 1000)
    const isNight = kstNow.getUTCHours() < 6 || kstNow.getUTCHours() >= 19

    const sunrise = riseSetToUnix(riseSet.sunrise, today)
    const sunset  = riseSetToUnix(riseSet.sunset, today)

    const rain =
      (current.PTY === '1' || current.PTY === '4') &&
      current.PCP !== '-' &&
      current.PCP !== '강수없음'
        ? { '1h': parseFloat(current.PCP) || 0 }
        : undefined

    const snow =
      (current.PTY === '2' || current.PTY === '3') &&
      current.SNO !== '-' &&
      current.SNO !== '적설없음'
        ? { '1h': parseFloat(current.SNO) || 0 }
        : undefined

    return NextResponse.json({
      temp,
      feelsLike:   windChill(temp, windSpeed),
      humidity,
      windSpeed,
      windDeg,
      clouds,
      visibility:  10000,
      description: weatherDescription(current.SKY, current.PTY),
      icon:        weatherIcon(current.SKY, current.PTY, isNight),
      sunrise,
      sunset,
      rain,
      snow,
      moonPhase,
    })
  } catch (e) {
    console.error('[weather API]', e)
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
