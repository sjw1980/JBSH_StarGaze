import { NextResponse } from 'next/server'
import { OBSERVATORY } from '@/lib/constants'

const API_KEY = process.env.OPENWEATHERMAP_API_KEY

function makeDemoForecast() {
  const now = Math.floor(Date.now() / 1000)
  return Array.from({ length: 8 }, (_, i) => ({
    dt: now + i * 3 * 3600,
    temp: 14 + Math.sin(i * 0.8) * 5,
    clouds: [15, 20, 35, 50, 40, 25, 18, 12][i],
    pop: [0.05, 0.1, 0.2, 0.3, 0.15, 0.05, 0.02, 0.02][i],
    windSpeed: 2 + Math.random() * 2,
    humidity: 55 + i * 2,
    description: '맑음 (데모)',
  }))
}

export async function GET() {
  if (!API_KEY) {
    return NextResponse.json(makeDemoForecast())
  }

  const url = `https://api.openweathermap.org/data/2.5/forecast?lat=${OBSERVATORY.lat}&lon=${OBSERVATORY.lon}&appid=${API_KEY}&units=metric&lang=kr&cnt=8`

  try {
    const res = await fetch(url, { next: { revalidate: 1800 } })
    if (!res.ok) throw new Error(`OWM ${res.status}`)
    const data = await res.json()

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const forecast = data.list.map((item: any) => ({
      dt: item.dt,
      temp: item.main.temp,
      clouds: item.clouds.all,
      pop: item.pop,
      rain: item.rain,
      snow: item.snow,
      windSpeed: item.wind.speed,
      humidity: item.main.humidity,
      description: item.weather[0].description,
    }))

    return NextResponse.json(forecast)
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
