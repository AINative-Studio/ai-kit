/**
 * Weather tool for fetching current weather information
 */

export interface WeatherInput {
  location: string
  unit?: 'celsius' | 'fahrenheit'
}

export interface WeatherOutput {
  location: string
  temperature: number
  unit: string
  condition: string
  humidity: number
  windSpeed: number
  description: string
}

export const weather = {
  name: 'weather',
  description: 'Gets current weather information for a specific location',

  parameters: {
    type: 'object',
    properties: {
      location: {
        type: 'string',
        description: 'City name or location (e.g., "London", "New York, NY")',
      },
      unit: {
        type: 'string',
        enum: ['celsius', 'fahrenheit'],
        description: 'Temperature unit (default: celsius)',
      },
    },
    required: ['location'],
  },

  execute: async (input: WeatherInput): Promise<WeatherOutput> => {
    const unit = input.unit || 'celsius'

    // In production, replace with actual weather API call
    // Example: OpenWeatherMap, WeatherAPI, etc.

    try {
      // Mock implementation for demo
      const mockWeather = await fetchWeather(input.location, unit)

      return {
        location: input.location,
        temperature: mockWeather.temp,
        unit: unit === 'celsius' ? '°C' : '°F',
        condition: mockWeather.condition,
        humidity: mockWeather.humidity,
        windSpeed: mockWeather.windSpeed,
        description: `Current weather in ${input.location}: ${mockWeather.condition}, ${mockWeather.temp}${unit === 'celsius' ? '°C' : '°F'}`,
      }
    } catch (error) {
      throw new Error(`Weather API error: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  },
}

async function fetchWeather(
  location: string,
  unit: string
): Promise<{
  temp: number
  condition: string
  humidity: number
  windSpeed: number
}> {
  // Mock data for demo - replace with actual API call
  // Example: https://api.openweathermap.org/data/2.5/weather

  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 500))

  const conditions = ['Sunny', 'Cloudy', 'Rainy', 'Partly Cloudy', 'Clear']
  const randomCondition = conditions[Math.floor(Math.random() * conditions.length)]

  return {
    temp: unit === 'celsius' ? Math.floor(Math.random() * 30) + 10 : Math.floor(Math.random() * 50) + 50,
    condition: randomCondition,
    humidity: Math.floor(Math.random() * 40) + 40,
    windSpeed: Math.floor(Math.random() * 20) + 5,
  }
}
