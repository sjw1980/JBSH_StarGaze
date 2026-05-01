export interface WeatherData {
  temp: number
  feelsLike: number
  humidity: number
  windSpeed: number
  windDeg: number
  clouds: number
  visibility: number
  description: string
  icon: string
  sunrise: number
  sunset: number
  rain?: { '1h': number }
  snow?: { '1h': number }
  moonPhase?: number
}

export interface ForecastItem {
  dt: number
  temp: number
  clouds: number
  pop: number
  rain?: { '3h': number }
  snow?: { '3h': number }
  windSpeed: number
  humidity: number
  description: string
}

export type ObservationStatus = '최적' | '보통' | '불가'
export type PanelType = 'observation' | 'weather' | 'resource' | null
