import "./style.css";

const searchInputElement = document.getElementById("searchInput") as HTMLInputElement;
const searchButtonElement = document.getElementById("searchButton") as HTMLButtonElement;

const searchLoadingElement = document.getElementById("searchLoading") as HTMLDivElement;
const searchErrorElement = document.getElementById("searchError") as HTMLDivElement;
const searchResultsElement = document.getElementById("searchResults") as HTMLDivElement;

const weatherLoadingElement = document.getElementById("weatherLoading") as HTMLDivElement;
const weatherErrorElement = document.getElementById("weatherError") as HTMLDivElement;
const weatherContentElement = document.getElementById("weatherContent") as HTMLDivElement;



async function searchCity(city: string) {
  const url = `https://geocoding-api.open-meteo.com/v1/search?name=${city}&count=5&language=en&format=json`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error("City search failed");
  }
  const data = await response.json();

  return data.results || [];
}

async function getWeather(latitude: number, longitude: number) {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m&daily=weather_code,temperature_2m_max,temperature_2m_min&timezone=auto&forecast_days=5`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error("Weather request failed");
  }
  const data = await response.json();

  return data;
}

function getDayName(date: string): string {
  return new Date(date + "T12:00:00").toLocaleDateString("en-US", {
    weekday: "short",
  });
}

function getWeatherDescription(code: number): string {
  if (code === 0) return "Clear sky";
    if (code < 45) return "Cloudy";
    return "Rainy";
}

function showCities(cities: any[]) {
  searchResultsElement.innerHTML = "";
  if (cities.length === 0) {
    searchErrorElement.textContent = "No matching cities found.";
    searchErrorElement.classList.remove("hidden");
    return;
  }
  cities.forEach((city) => {
    const button = document.createElement("button");

    button.textContent = `${city.name}, ${city.country}`;
    button.className = "location-option";

    button.addEventListener("click", () => {
      showWeather(city);
    });
    searchResultsElement.appendChild(button);
  });
}


async function showWeather(city: any) {
  searchResultsElement.innerHTML = "";
  weatherContentElement.classList.add("hidden");
  weatherErrorElement.classList.add("hidden");
  weatherLoadingElement.classList.remove("hidden");

  try {
    const data = await getWeather(city.latitude, city.longitude);

    const weather = data.current;
    const forecast = data.daily;


    weatherContentElement.innerHTML = `
      <h2>${city.name}, ${city.country}</h2>

      <h1>${weather.temperature_2m}°C</h1>

      <p>${getWeatherDescription(weather.weather_code)}</p>

      <p>Feels Like: ${weather.apparent_temperature}°C</p>

      <p>Humidity: ${weather.relative_humidity_2m}%</p>

      <p>Wind Speed: ${weather.wind_speed_10m} km/h</p>

      <hr>

      <h2>5-Day Forecast</h2>

      <div id="forecastList"></div>
    `;


    const forecastList = document.getElementById("forecastList");
    if (!forecastList) {
      throw new Error("Forecast element not found");
    }


    for (let i = 0; i < forecast.time.length; i++) {
      const day = document.createElement("div");

      day.className = "forecast-item";

      day.innerHTML = `
        <p>${getDayName(forecast.time[i])}</p>

        <p>${getWeatherDescription(forecast.weather_code[i])}</p>

        <p>
          ${Math.round(forecast.temperature_2m_max[i])}° /
          ${Math.round(forecast.temperature_2m_min[i])}°
        </p>
      `;

      forecastList.appendChild(day);
    }

    weatherContentElement.classList.remove("hidden");

  } catch (error) {
    weatherErrorElement.textContent = "Unable to load weather. Try again.";
    weatherErrorElement.classList.remove("hidden");

  } finally {
    weatherLoadingElement.classList.add("hidden");
  }
}


searchButtonElement.addEventListener("click", async () => {
  const city = searchInputElement.value.trim();

  if (city === "") {
    searchErrorElement.textContent = "Please enter a city name.";
    searchErrorElement.classList.remove("hidden");
    return;
  }

  searchLoadingElement.classList.remove("hidden");
  searchErrorElement.classList.add("hidden");
  searchResultsElement.innerHTML = "";

  try {
    const cities = await searchCity(city);
    showCities(cities);

  } catch (error) {
    searchErrorElement.textContent = "Unable to search cities.";
    searchErrorElement.classList.remove("hidden");

  } finally {
    searchLoadingElement.classList.add("hidden");
  }
});
