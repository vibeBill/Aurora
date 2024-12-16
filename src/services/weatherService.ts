// services/weatherService.ts
import axios from "axios";
import { WeatherResponse } from "@/types";

export async function getWeather(lat: number, lon: number) {
  try {
    const response = await axios.get<WeatherResponse>(
      `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&appid=${process.env.OPENWEATHER_API_KEY}&lang=zh_cn`
    );

    return {
      temperature: response.data.main.temp,
      humidity: response.data.main.humidity,
      description: response.data.weather[0].description,
    };
  } catch (error) {
    console.error("Weather API error:", error);
    throw error;
  }
}
