export const fieldLabels = {
  timestamp: "Time",
  dt: "Unix Time",
  hour_of_day: "Hour",
  sys_sunrise: "Sunrise",
  sys_sunset: "Sunset",
  timezone: "Timezone",
  name: "City",
  sys_country: "Country",
  coord_lat: "Lat",
  coord_lon: "Lon",
  weather_0_main: "Weather",
  weather_0_description: "Description",
  weather_0_icon: "Icon",
  main_temp: "Temperature",
  main_feels_like: "Feels Like",
  main_temp_min: "Min Temp",
  main_temp_max: "Max Temp",
  main_humidity: "Humidity",
  main_pressure: "Pressure",
  main_sea_level: "Sea Level",
  main_grnd_level: "Ground Level",
  clouds_all: "Clouds",
  visibility: "Visibility",
  wind_speed: "Wind Speed",
  wind_gust: "Wind Gust",
  wind_deg: "Wind Dir",
}

export const getTimestampField = (items) =>
  Object.keys(items[0] || {}).find((field) =>
    field.toLowerCase().includes("timestamp")
  )

export const sortItemsByTimestamp = (items, timestampField) => {
  if (!timestampField) return items
  return [...items].sort((a, b) => {
    const aTime =
      typeof a[timestampField] === "number"
        ? a[timestampField]
        : new Date(a[timestampField]).getTime()
    const bTime =
      typeof b[timestampField] === "number"
        ? b[timestampField]
        : new Date(b[timestampField]).getTime()
    return bTime - aTime
  })
}

export const formatSummaryTime = (value) => {
  const date = new Date(value)
  const month = date.toLocaleString("en-US", { month: "short" })
  const day = date.getDate()
  const hours = date.getHours()
  const displayHour = hours % 12 || 12
  const ampm = hours >= 12 ? "pm" : "am"
  return `${displayHour}${ampm} / ${month} ${day}`
}

export const formatValue = (key, value) => {
  if (value === null || value === undefined) return ""

  const lowerKey = key.toLowerCase()
  const numberValue = typeof value === "number" ? value : Number(value)

  if (key === "timezone" && !Number.isNaN(numberValue)) {
    const hours = numberValue / 3600
    return `UTC${hours >= 0 ? "+" : ""}${hours}`
  }

  if (!Number.isNaN(numberValue)) {
    if (lowerKey.includes("temp") || lowerKey.includes("feels_like")) {
      return `${numberValue}°C`
    }
    if (lowerKey.includes("humidity") || lowerKey.includes("cloud")) {
      return `${numberValue}%`
    }
    if (
      lowerKey.includes("pressure") ||
      lowerKey.includes("sea_level") ||
      lowerKey.includes("grnd_level")
    ) {
      return `${numberValue} hPa`
    }
    if (lowerKey.includes("wind_speed") || lowerKey.includes("wind_gust")) {
      return `${numberValue} m/s`
    }
    if (lowerKey.includes("wind_deg")) return `${numberValue}°`
    if (lowerKey.includes("visibility")) return `${numberValue} m`
    if (lowerKey.includes("lat") || lowerKey.includes("lon")) {
      return numberValue.toFixed(4)
    }
  }

  if (
    lowerKey.includes("timestamp") ||
    lowerKey.includes("sunrise") ||
    lowerKey.includes("sunset") ||
    lowerKey === "dt"
  ) {
    const dateValue =
      typeof value === "number" && value < 1e12 ? value * 1000 : value
    const date = new Date(dateValue)
    return date.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    })
  }

  return value
}

export const computeFieldRanges = (items) =>
  items.reduce((acc, item) => {
    Object.entries(item).forEach(([key, value]) => {
      const numberValue = typeof value === "number" ? value : Number(value)
      if (Number.isNaN(numberValue)) return
      const current = acc[key] || { min: numberValue, max: numberValue }
      acc[key] = {
        min: Math.min(current.min, numberValue),
        max: Math.max(current.max, numberValue),
      }
    })
    return acc
  }, {})

export const shouldColorField = (field) => {
  const lowerField = field.toLowerCase()
  return !(
    lowerField.includes("timestamp") ||
    lowerField.includes("sunrise") ||
    lowerField.includes("sunset") ||
    lowerField.includes("timezone") ||
    lowerField === "dt" ||
    lowerField.includes("hour")
  )
}

export const getFieldColor = (field, value, fieldRanges) => {
  if (!shouldColorField(field)) return "transparent"
  const numberValue = typeof value === "number" ? value : Number(value)
  if (Number.isNaN(numberValue)) return "transparent"
  const range = fieldRanges[field]
  if (!range) return "transparent"
  const isDarkMode =
    typeof window !== "undefined" &&
    window.matchMedia &&
    window.matchMedia("(prefers-color-scheme: dark)").matches
  const ratio =
    range.max === range.min
      ? 0.5
      : (numberValue - range.min) / (range.max - range.min)
  const start = isDarkMode
    ? { r: 58, g: 70, b: 96 }
    : { r: 246, g: 248, b: 255 }
  const end = isDarkMode
    ? { r: 156, g: 110, b: 92 }
    : { r: 255, g: 232, b: 210 }
  const r = Math.round(start.r * (1 - ratio) + end.r * ratio)
  const g = Math.round(start.g * (1 - ratio) + end.g * ratio)
  const b = Math.round(start.b * (1 - ratio) + end.b * ratio)
  const alpha = isDarkMode ? 0.9 : 0.6
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

export const buildMetricTables = (availableFields) =>
  [
    { title: "Temperature", fields: ["main_temp", "main_feels_like"] },
    { title: "Clouds", fields: ["clouds_all"] },
    { title: "Wind", fields: ["wind_speed", "wind_gust", "wind_deg"] },
    { title: "Pressure", fields: ["main_pressure", "main_sea_level"] },
    { title: "Humidity", fields: ["main_humidity"] },
    { title: "Weather", fields: ["weather_0_main"] },
  ]
    .map((table) => ({
      ...table,
      fields: table.fields.filter((field) => availableFields.has(field)),
    }))
    .filter((table) => table.fields.length)

export const labelForField = (field, labels = fieldLabels) =>
  labels[field] ||
  field
    .replace(/_/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase())
