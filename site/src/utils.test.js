import test from "node:test"
import assert from "node:assert/strict"
import {
  buildMetricTables,
  computeFieldRanges,
  formatSummaryTime,
  formatValue,
  getFieldColor,
  getTimestampField,
  labelForField,
  shouldColorField,
  sortItemsByTimestamp,
} from "./utils.js"

test("getTimestampField finds timestamp-like keys", () => {
  const items = [{ created_timestamp: 1, value: 10 }]
  assert.equal(getTimestampField(items), "created_timestamp")
})

test("sortItemsByTimestamp orders newest first", () => {
  const items = [
    { timestamp: 100, value: "a" },
    { timestamp: 300, value: "b" },
    { timestamp: 200, value: "c" },
  ]
  const sorted = sortItemsByTimestamp(items, "timestamp")
  assert.deepEqual(
    sorted.map((item) => item.value),
    ["b", "c", "a"]
  )
})

test("formatValue formats numeric fields", () => {
  assert.equal(formatValue("main_temp", 20), "20°C")
  assert.equal(formatValue("main_humidity", "45"), "45%")
  assert.equal(formatValue("timezone", 3600), "UTC+1")
  assert.equal(formatValue("coord_lat", 12.34567), "12.3457")
  assert.equal(formatValue("wind_deg", 270), "W")
  assert.equal(
    formatValue("weather_0_description", "clear sky"),
    "Clear Sky"
  )
})

test("formatValue returns empty string for nullish values", () => {
  assert.equal(formatValue("main_temp", null), "")
  assert.equal(formatValue("main_temp", undefined), "")
})

test("formatSummaryTime returns a compact label", () => {
  const result = formatSummaryTime("2024-01-01T15:00:00Z")
  assert.match(result, /^\d+(am|pm) \/ [A-Za-z]{3} \d+$/)
})

test("computeFieldRanges tracks min and max", () => {
  const ranges = computeFieldRanges([
    { main_temp: 10, main_humidity: "50" },
    { main_temp: 25, main_humidity: "40" },
  ])
  assert.deepEqual(ranges.main_temp, { min: 10, max: 25 })
  assert.deepEqual(ranges.main_humidity, { min: 40, max: 50 })
})

test("shouldColorField skips time fields", () => {
  assert.equal(shouldColorField("timestamp"), false)
  assert.equal(shouldColorField("sys_sunset"), false)
  assert.equal(shouldColorField("main_temp"), true)
})

test("getFieldColor returns scaled colors", () => {
  const ranges = { main_temp: { min: 0, max: 100 } }
  assert.equal(
    getFieldColor("main_temp", 0, ranges),
    "rgba(246, 248, 255, 0.6)"
  )
  assert.equal(
    getFieldColor("main_temp", 100, ranges),
    "rgba(255, 232, 210, 0.6)"
  )
  assert.equal(getFieldColor("timestamp", 0, ranges), "transparent")
})

test("buildMetricTables filters unavailable fields", () => {
  const tables = buildMetricTables(
    new Set(["main_temp", "wind_speed", "weather_0_description"])
  )
  const temperature = tables.find((table) => table.title === "Temperature")
  const wind = tables.find((table) => table.title === "Wind")
  const weather = tables.find((table) => table.title === "Weather")
  assert.deepEqual(temperature.fields, ["main_temp"])
  assert.deepEqual(wind.fields, ["wind_speed"])
  assert.deepEqual(weather.fields, ["weather_0_description"])
})

test("labelForField uses friendly labels", () => {
  assert.equal(labelForField("main_temp"), "Temperature")
  assert.equal(labelForField("custom_field"), "Custom Field")
})
