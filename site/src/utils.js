export const fieldLabels = {
  timestamp: "Time",
  weather_0_description: "Description",
  main_temp: "Temperature",
  main_feels_like: "Feels Like",
  main_humidity: "Humidity",
  clouds_all: "Clouds",
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

export const toTimestampMs = (value) =>
  typeof value === "number" && value < 1e12
    ? value * 1000
    : new Date(value).getTime()

export const formatSummaryTime = (value) => {
  const date = new Date(value)
  const month = date.toLocaleString("en-US", { month: "short" })
  const day = date.getDate()
  const hours = date.getHours()
  const displayHour = hours % 12 || 12
  const ampm = hours >= 12 ? "pm" : "am"
  return `${displayHour}${ampm} / ${month} ${day}`
}

const windDirectionFromDegrees = (degrees) => {
  const directions = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"]
  const index = Math.round(degrees / 45) % directions.length
  return directions[index]
}

export const formatValue = (key, value) => {
  if (value === null || value === undefined) return ""

  if (key === "weather_0_description" && typeof value === "string") {
    // Convert sentence-like strings to title case for readability.
    return value
      ? value
          .split(" ")
          .map((word) => (word ? word[0].toUpperCase() + word.slice(1) : word))
          .join(" ")
      : value
  }

  const lowerKey = key.toLowerCase()
  const numberValue = typeof value === "number" ? value : Number(value)

  if (key === "timezone" && !Number.isNaN(numberValue)) {
    const hours = numberValue / 3600
    return `UTC${hours >= 0 ? "+" : ""}${hours}`
  }

  if (!Number.isNaN(numberValue)) {
    // Attach units based on field naming conventions.
    if (lowerKey.includes("temp") || lowerKey.includes("feels_like")) {
      return `${numberValue}°C`
    }
    if (lowerKey.includes("humidity") || lowerKey.includes("cloud")) {
      return `${numberValue}%`
    }
    if (lowerKey.includes("wind_speed") || lowerKey.includes("wind_gust")) {
      return `${numberValue} m/s`
    }
    if (lowerKey.includes("wind_deg")) {
      return windDirectionFromDegrees(numberValue)
    }
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
    // DynamoDB may store seconds since epoch; convert to ms when needed.
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
  // Map the value into a subtle gradient between low/high values.
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
    { title: "Weather", fields: ["weather_0_description"] },
    { title: "Temperature", fields: ["main_temp", "main_feels_like"] },
    { title: "Clouds", fields: ["clouds_all"] },
    { title: "Wind", fields: ["wind_speed", "wind_gust", "wind_deg"] },
    { title: "Humidity", fields: ["main_humidity"] },
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

export const filterItemsByFieldChange = (items, field) =>
  items.filter(
    (item, index) => index === 0 || item[field] !== items[index - 1][field]
  )

export const filterItemsByRoundedChange = (items, field, roundTo) =>
  items.filter((item, index) => {
    if (index === 0) return true
    const currentRounded = Math.floor(Number(item[field]) / roundTo) * roundTo
    const previousRounded =
      Math.floor(Number(items[index - 1][field]) / roundTo) * roundTo
    return currentRounded !== previousRounded
  })
