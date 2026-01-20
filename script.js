const apiKey = "";

const cityInput = document.getElementById("cityInput");
const weatherInfo = document.getElementById("weatherInfo");
const cityNameEl = document.getElementById("cityName");
const tempEl = document.getElementById("temperature");
const conditionEl = document.getElementById("condition");
const humidityEl = document.getElementById("humidity");
const windEl = document.getElementById("wind");
const sunriseEl = document.getElementById("sunrise");
const sunsetEl = document.getElementById("sunset");
const forecastEl = document.getElementById("forecast");
const statusEl = document.getElementById("status");
const toggleUnitBtn = document.getElementById("toggleUnit");

let isCelsius = true;
let forecastData = [];

// Helper to set background based on weather condition
function setBackground(condition) {
  let bg;
  switch (condition.toLowerCase()) {
    case "clear":
      bg = "linear-gradient(to right, #fbc2eb, #a6c1ee)";
      break;
    case "clouds":
      bg = "linear-gradient(to right, #bdc3c7, #2c3e50)";
      break;
    case "rain":
    case "drizzle":
      bg = "linear-gradient(to right, #00c6fb, #005bea)";
      break;
    case "snow":
      bg = "linear-gradient(to right, #e0eafc, #cfdef3)";
      break;
    case "thunderstorm":
      bg = "linear-gradient(to right, #141e30, #243b55)";
      break;
    case "mist":
    case "haze":
    case "fog":
      bg = "linear-gradient(to right, #bdc3c7, #95a5a6)";
      break;
    default:
      bg = "linear-gradient(to right, #74ebd5, #acb6e5)";
  }
  document.body.style.background = bg;
}

// Show error message
function showError(message) {
  statusEl.innerHTML = `<div class="error">${message}</div>`;
}

// Clear all display elements
function clearDisplay() {
  cityNameEl.textContent = "";
  tempEl.textContent = "";
  conditionEl.innerHTML = "";
  humidityEl.textContent = "";
  windEl.textContent = "";
  sunriseEl.textContent = "";
  sunsetEl.textContent = "";
  forecastEl.innerHTML = "";
  statusEl.innerHTML = "";
  document.body.style.background = ""; // Reset background
}

// Update current temperature display based on unit
function updateTempDisplay() {
  const tempC = parseFloat(tempEl.dataset.tempC);
  const feelsC = parseFloat(tempEl.dataset.feelsC);
  let temp, feels, unit;
  if (isCelsius) {
    temp = Math.round(tempC);
    feels = Math.round(feelsC);
    unit = "°C";
    toggleUnitBtn.textContent = "To °F";
  } else {
    temp = Math.round((tempC * 9 / 5) + 32);
    feels = Math.round((feelsC * 9 / 5) + 32);
    unit = "°F";
    toggleUnitBtn.textContent = "To °C";
  }
  tempEl.textContent = `Temperature: ${temp} ${unit} (feels like ${feels} ${unit})`;
}

// Display forecast based on current unit
function displayForecast() {
  forecastEl.innerHTML = "<h3>5-Day Forecast</h3>";
  forecastData.forEach(day => {
    const date = new Date(day.dt * 1000).toLocaleDateString();
    const tempC = day.main.temp;
    let temp, unit;
    if (isCelsius) {
      temp = Math.round(tempC);
      unit = "°C";
    } else {
      temp = Math.round((tempC * 9 / 5) + 32);
      unit = "°F";
    }
    forecastEl.innerHTML += `<p>${date}: ${temp} ${unit}, ${day.weather[0].description}</p>`;
  });
}

// Display current weather data
function displayWeather(data) {
  cityNameEl.textContent = `${data.name}, ${data.sys.country}`;
  tempEl.dataset.tempC = data.main.temp; // Store float in Celsius
  tempEl.dataset.feelsC = data.main.feels_like;
  updateTempDisplay(); // Display based on current unit

  const conditionMain = data.weather[0].main;
  const conditionDesc = data.weather[0].description;
  conditionEl.innerHTML = `Condition: ${conditionMain} (${conditionDesc})`;
  const iconCode = data.weather[0].icon;
  const iconUrl = `https://openweathermap.org/img/wn/${iconCode}@2x.png`;
  conditionEl.innerHTML += `<br><img src="${iconUrl}" alt="weather icon">`;

  humidityEl.textContent = `Humidity: ${data.main.humidity}%`;

  const windDir = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"][Math.round(data.wind.deg / 45) % 8];
  windEl.textContent = `Wind: ${data.wind.speed} m/s ${windDir}`;

  const sunrise = new Date(data.sys.sunrise * 1000).toLocaleTimeString();
  const sunset = new Date(data.sys.sunset * 1000).toLocaleTimeString();
  sunriseEl.textContent = `Sunrise: ${sunrise}`;
  sunsetEl.textContent = `Sunset: ${sunset}`;

  setBackground(conditionMain);
}

// Fetch weather for a city
async function getWeather(city = cityInput.value.trim()) {
  clearDisplay();
  if (!city) {
    showError("Please enter a city name");
    return;
  }
  statusEl.textContent = "Loading...";
  try {
    const url = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&units=metric&appid=${apiKey}`;
    const res = await fetch(url);
    if (!res.ok) throw await res.json();
    const data = await res.json();
    displayWeather(data);
    await getForecast(city);
    localStorage.setItem("lastCity", city);
    statusEl.textContent = "";
  } catch (error) {
    if (error.cod === "404") showError("City not found.");
    else if (error.cod === "401") showError("Invalid API key.");
    else showError("Something went wrong.");
  }
}

// Fetch 5-day forecast
async function getForecast(city) {
  try {
    const url = `https://api.openweathermap.org/data/2.5/forecast?q=${encodeURIComponent(city)}&units=metric&appid=${apiKey}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error("Failed to fetch forecast");
    const data = await res.json();
    forecastData = data.list.filter(item => item.dt_txt.includes("12:00:00"));
    displayForecast();
  } catch (error) {
    showError("Failed to load forecast.");
  }
}

// Toggle unit event
toggleUnitBtn.addEventListener("click", () => {
  isCelsius = !isCelsius;
  updateTempDisplay();
  if (forecastData.length > 0) displayForecast();
});

// Enter key search
cityInput.addEventListener("keypress", (e) => {
  if (e.key === "Enter") getWeather();
});

// On load: last city or geolocation
window.onload = () => {
  const lastCity = localStorage.getItem("lastCity");
  if (lastCity) {
    cityInput.value = lastCity;
    getWeather(lastCity);
  } else if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(async pos => {
      clearDisplay();
      statusEl.textContent = "Loading location weather...";
      const { latitude, longitude } = pos.coords;
      try {
        const url = `https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&units=metric&appid=${apiKey}`;
        const res = await fetch(url);
        if (!res.ok) throw await res.json();
        const data = await res.json();
        displayWeather(data);
        await getForecast(data.name);
        localStorage.setItem("lastCity", data.name);
        statusEl.textContent = "";
      } catch (error) {
        showError("Failed to fetch location weather.");
      }
    }, () => {
      showError("Geolocation access denied.");
    });
  }
};
