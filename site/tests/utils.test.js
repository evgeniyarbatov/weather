import { test } from "node:test"
import assert from "node:assert/strict"
import {
  buildMetricTables,
  filterItemsByFieldChange,
  filterItemsByRoundedChange,
} from "../src/utils.js"

test("filterItemsByFieldChange keeps only changes vs previous row", () => {
  const items = [
    { clouds_all: 10 },
    { clouds_all: 10 },
    { clouds_all: 20 },
    { clouds_all: 20 },
    { clouds_all: 15 },
  ]

  const filtered = filterItemsByFieldChange(items, "clouds_all")

  assert.deepEqual(
    filtered.map((item) => item.clouds_all),
    [10, 20, 15]
  )
})

test("buildMetricTables omits pressure section", () => {
  const availableFields = new Set([
    "main_temp",
    "main_feels_like",
    "main_pressure",
    "main_sea_level",
  ])

  const tables = buildMetricTables(availableFields)

  assert.equal(
    tables.some((table) => table.title === "Pressure"),
    false
  )
})

test("filterItemsByRoundedChange uses rounded steps but keeps raw values", () => {
  const items = [
    { main_humidity: 41 },
    { main_humidity: 44 },
    { main_humidity: 46 },
    { main_humidity: 55 },
    { main_humidity: 54 },
  ]

  const filtered = filterItemsByRoundedChange(items, "main_humidity", 10)

  assert.deepEqual(
    filtered.map((item) => item.main_humidity),
    [41, 55]
  )
})
