/* eslint-disable @next/next/no-img-element */
"use client";

import React, { useEffect, useState } from "react";
import axios from "axios";

interface WeatherData {
  main: { temp: number };
  weather: { description: string; icon: string };
}

interface ForecastItem {
  dt_txt: string;
  main: { temp: number };
  weather: { description: string; icon: string }[];
}

const WeatherForecast = ({ collapsed, city }: { collapsed: boolean; city?: string }) => {
  const [currentWeather, setCurrentWeather] = useState<WeatherData | null>(null);
  const [forecast, setForecast] = useState<ForecastItem[]>([]);

  useEffect(() => {
    if (!city) return; // ✅ don't fetch if city is not loaded yet

    const urlCurrent = `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=85b735b582afdbb445ccb47ed6e4455a&units=metric`;
    const urlForecast = `https://api.openweathermap.org/data/2.5/forecast?q=${city}&appid=85b735b582afdbb445ccb47ed6e4455a&units=metric`;

    const fetchData = async () => {
      try {
        const currentRes = await axios.get(urlCurrent);
        const currentWeatherData: WeatherData = {
          main: { temp: currentRes.data.main.temp },
          weather: {
            description: currentRes.data.weather[0].description,
            icon: currentRes.data.weather[0].icon,
          },
        };
        setCurrentWeather(currentWeatherData);

        const forecastRes = await axios.get(urlForecast);
        // pick 2 future slots: ~24h, ~48h
        const selected = [forecastRes.data.list[8], forecastRes.data.list[16]];
        setForecast(selected);
      } catch (e) {
        console.error("Error fetching weather:", e);
      }
    };

    fetchData();
  }, [city]); // ✅ run again whenever `city` changes

  const forecastCards: {
    day: string;
    temp: string;
    weather: string;
    icon: string;
  }[] = [];

  if (currentWeather) {
    forecastCards.push({
      day: "Today",
      temp: `${Math.round(currentWeather.main.temp)}°C`,
      weather: currentWeather.weather.description,
      icon: `https://openweathermap.org/img/wn/${currentWeather.weather.icon}@2x.png`,
    });
  }

  forecast.forEach((item, idx) => {
    const dayNames = ["Tomorrow", "Day After"];
    forecastCards.push({
      day: dayNames[idx],
      temp: `${Math.round(item.main.temp)}°C`,
      weather: item.weather[0].description,
      icon: `https://openweathermap.org/img/wn/${item.weather[0].icon}@2x.png`,
    });
  });

  if (!city) {
    return (
      <div className={`mt-4 p-3 rounded-lg ${collapsed ? "" : "bg-blue-600/20"} text-white/90`}>
        <p className="text-sm">Loading location...</p>
      </div>
    );
  }

  return (
    <div className={`mt-2 p-2 rounded-lg ${collapsed ? "" : "mt-2"} text-white/90`}>
      {!collapsed && <h3 className="text-md font-semibold mb-3 text-center text-teal-200">{city} Weather</h3>}

      <div className={`flex ${collapsed ? "flex-col gap-4 ms-[-10]" : "flex-col space-y-2"}`}>
        {forecastCards.map((day) => (
          <div
            key={day.day}
            className={`flex items-center justify-between border border-teal-500 p-2 rounded-2xl 
              ${collapsed ? "relative group cursor-pointer w-11" : "hover:bg-teal-500 transition"}`}
          >
            {/* Always show icon */}
            <img src={day.icon} alt={day.weather} width={44} height={44} />

            {/* Expanded: show details */}
            {!collapsed && (
              <div className="flex justify-between flex-1 ml-2">
                <span className="text-xs font-medium">{day.day}</span>
                <div className="flex flex-col items-end">
                  <span className="font-semibold">{day.temp}</span>
                  <span className="text-xs capitalize text-right">{day.weather}</span>
                </div>
              </div>
            )}

            {/* Collapsed: show tooltip */}
            {collapsed && (
              <div className="absolute left-12 px-2 py-1 text-xs rounded bg-slate-800/90 text-white 
                              z-50 opacity-0 group-hover:opacity-100 transition whitespace-nowrap">
                {day.day}: {day.weather}, {day.temp}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default WeatherForecast;
