import { NextResponse } from 'next/server'
import { OBSERVATORY } from '@/lib/constants'

const API_KEY = process.env.OPENWEATHERMAP_API_KEY

// Demo data when no API key is configured
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
}

export async function GET() {
  if (!API_KEY) {
    return NextResponse.json(demoWeather)
  }

  const url = `https://api.openweathermap.org/data/2.5/weather?lat=${OBSERVATORY.lat}&lon=${OBSERVATORY.lon}&appid=${API_KEY}&units=metric&lang=kr`

  try {
    const res = await fetch(url, { next: { revalidate: 300 } })
    if (!res.ok) throw new Error(`OWM ${res.status}`)
    const data = await res.json()

    return NextResponse.json({
      temp: data.main.temp,
      feelsLike: data.main.feels_like,
      humidity: data.main.humidity,
      windSpeed: data.wind.speed,
      windDeg: data.wind.deg ?? 0,
      clouds: data.clouds.all,
      visibility: data.visibility ?? 10000,
      description: data.weather[0].description,
      icon: data.weather[0].icon,
      sunrise: data.sys.sunrise,
      sunset: data.sys.sunset,
      rain: data.rain,
      snow: data.snow,
    })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
