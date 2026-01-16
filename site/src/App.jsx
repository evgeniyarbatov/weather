import React, { useEffect, useState } from 'react'
import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { DynamoDBDocumentClient, ScanCommand } from '@aws-sdk/lib-dynamodb'
import { fromCognitoIdentityPool } from '@aws-sdk/credential-provider-cognito-identity'
import {
  buildMetricTables,
  computeFieldRanges,
  formatSummaryTime,
  formatValue,
  getFieldColor,
  getTimestampField,
  labelForField,
  sortItemsByTimestamp,
} from './utils'

const region = __AWS_REGION__
const tableName = __TABLE_NAME__
const identityPoolId = __COGNITO_IDENTITY_POOL_ID__

function App() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

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

        const timestampField = getTimestampField(fetchedItems)
        setItems(sortItemsByTimestamp(fetchedItems, timestampField))
      } catch (err) {
        console.error('Error fetching data:', err)
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  if (loading) return <div></div>
  if (error) return <div>Error: {error}</div>
  if (items.length === 0) return <div>No data</div>

  const timestampField = getTimestampField(items)
  const availableFields = new Set(Object.keys(items[0] || {}))
  const timeField = timestampField || "timestamp"

  const fieldRanges = computeFieldRanges(items)
  const metricTables = buildMetricTables(availableFields)

  return (
    <div style={{ minHeight: "100vh", padding: "32px 20px", background: "var(--page-bg)", boxSizing: "border-box" }}>
      <div style={{ maxWidth: "980px", margin: "0 auto", display: "grid", gap: "24px" }}>
        <div>
          <div>
            {metricTables.map((table) => (
              <div key={table.title} className="d-flex justify-content-center" style={{ width: "100%" }}>
                <table
                  className="table text-center"
                  style={{ borderCollapse: "collapse", marginBottom: "20px", background: "var(--surface)", width: "100%", fontSize: "13px" }}
                >
                  <thead>
                    <tr>
                    <th
                      style={{
                        border: "none",
                        padding: "8px 12px",
                        fontWeight: "600",
                        color: "var(--text)",
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
                            color: "var(--text)",
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
                          color: "var(--text)",
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
                              color: "var(--text)",
                              fontSize: "13px",
                              backgroundColor: getFieldColor(field, item[field], fieldRanges),
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
