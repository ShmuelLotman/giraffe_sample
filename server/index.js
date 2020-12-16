require('dotenv').config()
const express = require('express')
const axios = require('axios')
var cors = require('cors')

const DEFAULT_PORT = 8617

const parsed = require('dotenv').config().parsed
const url = parsed.INFLUX_URL
const token = parsed.INFLUX_TOKEN
const orgID = parsed.ORG_ID
const proxy = axios.create({
  baseURL: url,
  headers: {
    Authorization: `Token ${token}`,
    'Content-Type': 'application/json',
  },
})

const app = express()
app.use(cors())

app.get('/plot/:type', async (req, res) => {
  const getQuery = () => {
    switch (req.params.type) {
      case 'scatter':
        return `from(bucket: "slotman's Bucket")
        |> range(start: -5m)
        |> filter(fn: (r) => r["_measurement"] == "cpu")
        |> filter(fn: (r) => r["_field"] == "usage_guest" or r["_field"] == "usage_idle" or r["_field"] == "usage_system" or r["_field"] == "usage_user")
        |> aggregateWindow(every: v.windowPeriod, fn: mean, createEmpty: false)
        |> yield(name: "mean")`
      default:
        return `from(bucket: "slotman's Bucket")
        |> range(start: -5m)
        |> filter(fn: (r) => r["_measurement"] == "cpu")
        |> filter(fn: (r) => r["_field"] == "usage_guest" or r["_field"] == "usage_idle" or r["_field"] == "usage_system" or r["_field"] == "usage_user")
        |> aggregateWindow(every: v.windowPeriod, fn: mean, createEmpty: false)
        |> yield(name: "mean")`
    }
  }

  try {
    const response = await proxy.request({
      method: 'post',
      url: '/api/v2/query',
      params: {
        orgID,
      },
      data: {
        query: getQuery().trim(),
        extern: {
          type: 'File',
          package: null,
          imports: null,
          body: [
            {
              type: 'OptionStatement',
              assignment: {
                type: 'VariableAssignment',
                id: { type: 'Identifier', name: 'v' },
                init: {
                  type: 'ObjectExpression',
                  properties: [
                    {
                      type: 'Property',
                      key: { type: 'Identifier', name: 'bucket' },
                      value: { type: 'StringLiteral', value: '' },
                    },
                    {
                      type: 'Property',
                      key: { type: 'Identifier', name: 'timeRangeStart' },
                      value: {
                        type: 'UnaryExpression',
                        operator: '-',
                        argument: {
                          type: 'DurationLiteral',
                          values: [{ magnitude: 5, unit: 'm' }],
                        },
                      },
                    },
                    {
                      type: 'Property',
                      key: { type: 'Identifier', name: 'timeRangeStop' },
                      value: {
                        type: 'CallExpression',
                        callee: { type: 'Identifier', name: 'now' },
                      },
                    },
                    {
                      type: 'Property',
                      key: { type: 'Identifier', name: 'windowPeriod' },
                      value: {
                        type: 'DurationLiteral',
                        values: [{ magnitude: 10000, unit: 'ms' }],
                      },
                    },
                  ],
                },
              },
            },
          ],
        },
        dialect: { annotations: ['group', 'datatype', 'default'] },
      },
    })

    res.status(200).send(response.data)
  } catch (err) {
    console.log(err)
    res.status(400).send({
      err,
    })
  }
})

app.listen(DEFAULT_PORT, () => {
  console.log(`Hey there, listening porticularly closely at ${DEFAULT_PORT}!`)
})
