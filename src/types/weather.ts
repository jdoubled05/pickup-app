/**
 * Weather Types
 * Data structures for weather information display
 */

export type WeatherCondition = 'sunny' | 'clear' | 'cloudy' | 'rainy' | 'snow' | 'unknown';

export interface WeatherData {
  temp: number; // Temperature in Fahrenheit
  condition: WeatherCondition;
  icon: string; // Emoji representation
}

export interface WeatherCacheEntry {
  data: WeatherData;
  expires: number; // Timestamp in ms
}

export interface LatLon {
  lat: number;
  lon: number;
}
