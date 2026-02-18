/**
 * Weather Service
 * Fetches and caches weather data from WeatherAPI.com
 */

import { WeatherData, WeatherCondition, WeatherCacheEntry, LatLon } from '../types/weather';

// Cache weather by 5km grid cells (lat/lon rounded to 2 decimals)
const weatherCache = new Map<string, WeatherCacheEntry>();

const CACHE_TTL = 30 * 60 * 1000; // 30 minutes
const WEATHER_API_KEY = process.env.EXPO_PUBLIC_WEATHER_API_KEY || '';

/**
 * Get grid cell key for caching (rounds to ~5km grid)
 */
function getGridKey(lat: number, lon: number): string {
  const gridLat = Math.round(lat * 100) / 100;
  const gridLon = Math.round(lon * 100) / 100;
  return `${gridLat},${gridLon}`;
}

/**
 * Map WeatherAPI.com condition code to our condition type
 */
function mapConditionCode(code: number): WeatherCondition {
  // WeatherAPI.com condition codes
  // https://www.weatherapi.com/docs/weather_conditions.json
  if (code === 1000) return 'clear'; // Clear
  if (code >= 1003 && code <= 1009) return 'cloudy'; // Cloudy variations
  if (code >= 1063 && code <= 1201) return 'rainy'; // Rain variations
  if (code >= 1204 && code <= 1282) return 'snow'; // Snow variations
  if (code === 1000) return 'sunny'; // Sunny
  return 'unknown';
}

/**
 * Get weather icon emoji based on condition and time of day
 */
function getWeatherIcon(condition: WeatherCondition, isDay: boolean): string {
  switch (condition) {
    case 'sunny':
    case 'clear':
      return isDay ? '☀️' : '🌙';
    case 'cloudy':
      return '⛅';
    case 'rainy':
      return '🌧️';
    case 'snow':
      return '❄️';
    default:
      return '🌤️';
  }
}

/**
 * Fetch weather data for a location
 */
export async function getWeatherForLocation(
  lat: number,
  lon: number
): Promise<WeatherData | null> {
  // Check if API key is configured
  if (!WEATHER_API_KEY) {
    console.log('Weather API key not configured');
    return null;
  }

  const gridKey = getGridKey(lat, lon);
  const now = Date.now();

  // Check cache
  const cached = weatherCache.get(gridKey);
  if (cached && cached.expires > now) {
    return cached.data;
  }

  try {
    // Fetch from WeatherAPI.com
    const url = `https://api.weatherapi.com/v1/current.json?key=${WEATHER_API_KEY}&q=${lat},${lon}&aqi=no`;

    const response = await fetch(url);

    if (!response.ok) {
      console.error('Weather API error:', response.status);
      return null;
    }

    const data = await response.json();

    // Extract weather data
    const condition = mapConditionCode(data.current.condition.code);
    const tempF = Math.round(data.current.temp_f);
    const isDay = data.current.is_day === 1;
    const icon = getWeatherIcon(condition, isDay);

    const weatherData: WeatherData = {
      temp: tempF,
      condition,
      icon,
    };

    // Cache the result
    weatherCache.set(gridKey, {
      data: weatherData,
      expires: now + CACHE_TTL,
    });

    return weatherData;
  } catch (error) {
    console.error('Error fetching weather:', error);
    return null;
  }
}

/**
 * Clear expired cache entries
 */
export function clearExpiredWeatherCache(): void {
  const now = Date.now();
  for (const [key, entry] of weatherCache.entries()) {
    if (entry.expires <= now) {
      weatherCache.delete(key);
    }
  }
}

/**
 * Clear all weather cache
 */
export function clearWeatherCache(): void {
  weatherCache.clear();
}
