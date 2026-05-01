import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'
import type { PanelType, WeatherData, ForecastItem } from '@/types'

interface StoreState {
  expandedPanel: PanelType
  togglePanel: (panel: Exclude<PanelType, null>) => void
  weatherData: WeatherData | null
  forecastData: ForecastItem[]
  moonPhase: number
  isWeatherLoading: boolean
  weatherError: string | null
  setWeatherData: (data: WeatherData) => void
  setForecastData: (data: ForecastItem[]) => void
  setMoonPhase: (phase: number) => void
  setWeatherLoading: (loading: boolean) => void
  setWeatherError: (error: string | null) => void
  showConstellationLines: boolean
  toggleConstellationLines: () => void
}

export const useStore = create<StoreState>()(
  subscribeWithSelector((set) => ({
    expandedPanel: null,
    togglePanel: (panel) =>
      set((state) => ({
        expandedPanel: state.expandedPanel === panel ? null : panel,
      })),
    weatherData: null,
    forecastData: [],
    moonPhase: 0,
    isWeatherLoading: true,
    weatherError: null,
    setWeatherData: (data) => set({ weatherData: data }),
    setForecastData: (data) => set({ forecastData: data }),
    setMoonPhase: (phase) => set({ moonPhase: phase }),
    setWeatherLoading: (loading) => set({ isWeatherLoading: loading }),
    setWeatherError: (error) => set({ weatherError: error }),
    showConstellationLines: true,
    toggleConstellationLines: () =>
      set((state) => ({ showConstellationLines: !state.showConstellationLines })),
  })),
)
