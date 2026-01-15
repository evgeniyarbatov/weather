import React, { useEffect, useState } from 'react'
import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { DynamoDBDocumentClient, ScanCommand } from '@aws-sdk/lib-dynamodb'
import { fromCognitoIdentityPool } from '@aws-sdk/credential-provider-cognito-identity'

const region = __AWS_REGION__
const tableName = __TABLE_NAME__
const identityPoolId = __COGNITO_IDENTITY_POOL_ID__

function App() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fieldLabels = {
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

  useEffect(() => {
    const fetchData = async () => {
      try {
        const client = new DynamoDBClient({
          region,
          credentials: fromCognitoIdentityPool({
            clientConfig: { region },
            identityPoolId,
          }),
        })
        const docClient = DynamoDBDocumentClient.from(client)
        const command = new ScanCommand({ 
          TableName: tableName
        })
        const result = await docClient.send(command)
        const fetchedItems = result.Items || []

        const timestampField = Object.keys(fetchedItems[0] || {}).find(f =>
          f.toLowerCase().includes('timestamp')
        )

        if (timestampField) {
          fetchedItems.sort((a, b) => {
            const aTime = typeof a[timestampField] === 'number' ? a[timestampField] : new Date(a[timestampField]).getTime()
            const bTime = typeof b[timestampField] === 'number' ? b[timestampField] : new Date(b[timestampField]).getTime()
            return bTime - aTime
          })
        }

        setItems(fetchedItems)
      } catch (err) {
        console.error('Error fetching data:', err)
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const formatSummaryTime = (value) => {
    const date = new Date(value)
    const month = date.toLocaleString("en-US", { month: "short" })
    const day = date.getDate()
    const hours = date.getHours()
    const displayHour = hours % 12 || 12
    const ampm = hours >= 12 ? "pm" : "am"
    return `${displayHour}${ampm} / ${month} ${day}`
  }

  const formatValue = (key, value) => {
    if (value === null || value === undefined) return ""

    const lowerKey = key.toLowerCase()
    const numberValue = typeof value === "number" ? value : Number(value)

    if (key === "timezone" && !Number.isNaN(numberValue)) {
      const hours = numberValue / 3600
      return `UTC${hours >= 0 ? "+" : ""}${hours}`
    }

    if (!Number.isNaN(numberValue)) {
      if (lowerKey.includes("temp")) return `${numberValue}°C`
      if (lowerKey.includes("humidity") || lowerKey.includes("cloud")) return `${numberValue}%`
      if (lowerKey.includes("pressure")) return `${numberValue} hPa`
      if (lowerKey.includes("wind_speed") || lowerKey.includes("wind_gust")) return `${numberValue} m/s`
      if (lowerKey.includes("wind_deg")) return `${numberValue}°`
      if (lowerKey.includes("visibility")) return `${numberValue} m`
      if (lowerKey.includes("lat") || lowerKey.includes("lon")) return numberValue.toFixed(4)
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

  if (loading) return <div></div>
  if (error) return <div>Error: {error}</div>
  if (items.length === 0) return <div>No data</div>

  const timestampField = Object.keys(items[0]).find(f => f.toLowerCase().includes('timestamp'))
  const availableFields = new Set(Object.keys(items[0] || {}))
  const timeField = timestampField || "timestamp"

  const fieldRanges = items.reduce((acc, item) => {
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

  const shouldColorField = (field) => {
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

  const getFieldColor = (field, value) => {
    if (!shouldColorField(field)) return "transparent"
    const numberValue = typeof value === "number" ? value : Number(value)
    if (Number.isNaN(numberValue)) return "transparent"
    const range = fieldRanges[field]
    if (!range) return "transparent"
    const ratio =
      range.max === range.min ? 0.5 : (numberValue - range.min) / (range.max - range.min)
    const r = Math.round(246 * (1 - ratio) + 255 * ratio)
    const g = Math.round(248 * (1 - ratio) + 232 * ratio)
    const b = Math.round(255 * (1 - ratio) + 210 * ratio)
    return `rgba(${r}, ${g}, ${b}, 0.6)`
  }

  const metricTables = [
    {
      title: "Temperature",
      fields: ["main_temp", "main_feels_like"],
    },
    {
      title: "Clouds",
      fields: ["clouds_all"],
    },
    {
      title: "Wind",
      fields: ["wind_speed", "wind_gust", "wind_deg"],
    },
    {
      title: "Pressure",
      fields: ["main_pressure", "main_sea_level", "main_grnd_level"],
    },
    {
      title: "Humidity",
      fields: ["main_humidity"],
    },
    {
      title: "Visibility",
      fields: ["visibility"],
    },
  ]
    .map(table => ({
      ...table,
      fields: table.fields.filter(field => availableFields.has(field)),
    }))
    .filter(table => table.fields.length)

  const labelForField = (field) =>
    fieldLabels[field] ||
    field
      .replace(/_/g, " ")
      .replace(/\b\w/g, (letter) => letter.toUpperCase())

  return (
    <div style={{ height: "100vh", padding: "32px 20px", background: "#fff", overflow: "hidden", boxSizing: "border-box" }}>
      <div style={{ maxWidth: "980px", height: "100%", margin: "0 auto", display: "grid", gap: "24px" }}>
        <div>
          <div style={{ height: "100%", overflowY: "auto" }}>
            {metricTables.map((table) => (
              <div key={table.title} className="d-flex justify-content-center" style={{ width: "100%" }}>
                <table
                  className="table text-center"
                  style={{ borderCollapse: "collapse", marginBottom: "20px", background: "#fff", width: "100%", fontSize: "13px" }}
                >
                  <thead>
                    <tr>
                    <th
                      style={{
                        border: "none",
                        padding: "8px 12px",
                        fontWeight: "600",
                        color: "#333",
                        textAlign: "center",
                        fontSize: "13px",
                        width: "140px",
                      }}
                    >
                      {labelForField(timeField)}
                    </th>
                      {table.fields.map((field) => (
                        <th
                          key={`${table.title}-head-${field}`}
                          style={{
                            border: "none",
                            padding: "8px 12px",
                            fontWeight: "600",
                            color: "#333",
                            textAlign: "center",
                            fontSize: "13px",
                          }}
                        >
                          {labelForField(field)}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item, index) => (
                      <tr key={`${table.title}-row-${index}`}>
                      <td
                        style={{
                          border: "none",
                          padding: "8px 12px",
                          color: "#333",
                          fontSize: "13px",
                          width: "140px",
                        }}
                      >
                        {formatSummaryTime(item[timeField])}
                      </td>
                        {table.fields.map((field) => (
                          <td
                            key={`${table.title}-cell-${index}-${field}`}
                            style={{
                              border: "none",
                              padding: "8px 12px",
                              color: "#333",
                              fontSize: "13px",
                              backgroundColor: getFieldColor(field, item[field]),
                            }}
                          >
                            {formatValue(field, item[field])}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default App
