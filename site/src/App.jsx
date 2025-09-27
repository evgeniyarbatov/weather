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

  const headerLabels = {
    timestamp: "Time",
    temp: "Temperature",
    clouds: "Clouds",
  };

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

  const formatValue = (key, value) => {
    if (key.toLowerCase().includes('temp')) return `${value}°C`
    if (key.toLowerCase().includes('cloud')) return `${value}%`
    if (key.toLowerCase().includes('time') || key.toLowerCase().includes('date') || key.toLowerCase().includes('timestamp')) {
      const date = new Date(value)
      const month = date.toLocaleString('en-US', { month: 'short' })
      const day = date.getDate()
      const hours = date.getHours()
      const displayHour = hours % 12 || 12
      const ampm = hours >= 12 ? 'pm' : 'am'
      return `${displayHour}${ampm} / ${month} ${day}`
    }
    return value
  }

  // Get temp field
  const tempField = items.length > 0 ? Object.keys(items[0]).find(f => f.toLowerCase().includes('temp')) : null
  const temps = tempField ? items.map(i => Number(i[tempField])) : []
  const minTemp = Math.min(...temps)
  const maxTemp = Math.max(...temps)

  // Bright pastel color scale: very light blue → peachy orange
  const getTempColor = (temp) => {
    if (isNaN(temp)) return "inherit"
    const ratio = (temp - minTemp) / (maxTemp - minTemp || 1)

    // Brighter, pastel tones
    const r = Math.round(255 * ratio + 235 * (1 - ratio))   // 235 → 255
    const g = Math.round(230 * ratio + 250 * (1 - ratio))   // 250 → 230
    const b = Math.round(220 * ratio + 255 * (1 - ratio))   // 255 → 220

    // More transparency for airy feel
    return `rgba(${r},${g},${b},0.6)`
  }

  if (loading) return <div></div>
  if (error) return <div>Error: {error}</div>
  if (items.length === 0) return <div>No data</div>

  const timestampField = Object.keys(items[0]).find(f => f.toLowerCase().includes('timestamp'))
  const cloudsField = Object.keys(items[0]).find(f => f.toLowerCase().includes('cloud'))
  const orderedFields = [timestampField, tempField, cloudsField].filter(Boolean)

  return (
    <div className="d-flex justify-content-center align-items-center min-vh-100">
      <table className="table text-center" style={{ borderCollapse: "collapse" }}>
        <thead>
          <tr>
            {orderedFields.map((field) => (
              <th 
                key={field} 
                style={{ 
                  border: "none", 
                  padding: "12px 16px", 
                  fontWeight: "600", 
                  background: "transparent" 
                }}
              >
                {headerLabels[field]}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {items.map((item, idx) => (
            <tr key={idx}>
              {orderedFields.map((field) => (
                <td
                  key={field}
                  style={{
                    border: "none",
                    padding: "10px 14px",
                    backgroundColor:
                      field === tempField
                        ? getTempColor(Number(item[field]))
                        : "transparent",
                    color: "#333",
                    fontWeight: field === tempField ? "500" : "400",
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
  )
}

export default App
