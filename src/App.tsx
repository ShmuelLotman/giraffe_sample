import React, { FC, useState, useEffect, useCallback, ChangeEvent } from 'react'
import axios from 'axios'
import {
  Plot,
  fromFlux,
  HistogramLayerConfig,
  LayerConfig,
  FromFluxResult,
  Table,
} from '@influxdata/giraffe'
const REFRESH_RATE = 40000
const url = 'http://localhost:8617/plot'

interface StateConfig {
  table: Table | []
  layer: HistogramLayerConfig
  graphType: string
}
const style = {
  width: 'calc(70vw - 20px)',
  height: 'calc(70vh - 20px)',
  margin: '40px',
}

const setConfigs = (graphType: string): LayerConfig => {
  switch (graphType) {
    case 'histogram':
      return {
        type: 'histogram',
        x: '_value',
        fill: ['_field'],
        position: 'stacked',
        binCount: 30,
        colors: ['#468352', '#c885b5', '#ee7015'],
        fillOpacity: 1,
      }
    case 'scatter':
      return {
        type: 'scatter',
        x: '_time',
        y: '_value',
        fill: ['_field'],
        colors: ['#468352', '#c885b5', '#ee7015'],
      }
    default:
      return {
        type: 'histogram',
        x: '_value',
        fill: ['_field'],
        position: 'stacked',
        binCount: 30,
        colors: ['#468352', '#c885b5', '#ee7015'],
        fillOpacity: 1,
      }
  }
}

const App: FC = (): JSX.Element => {
  const [tableState, setTableState] = useState<StateConfig>({
    table: [],
    layer: {
      type: 'histogram',
      x: '_value',
      fill: ['_field'],
      position: 'stacked',
      binCount: 30,
      colors: ['#468352', '#c885b5', '#ee7015'],
      fillOpacity: 1,
    },
    graphType: 'histogram',
  })

  const getFormatPlotData = useCallback(async (): Promise<void> => {
    const type = tableState.graphType
    const res = await axios.get(`${url}/${type}`)
    let parsedData: FromFluxResult

    try {
      parsedData = fromFlux(res.data)
      setTableState((prev: any) => ({
        ...prev,
        table: parsedData.table,
        fill: ['_field'],
      }))
    } catch (error) {
      console.log('here')
      console.log(error)
    }
  }, [tableState.graphType])

  useEffect((): (() => void) => {
    getFormatPlotData()
    const interval = setInterval(getFormatPlotData, REFRESH_RATE)
    return () => clearInterval(interval)
  }, [tableState.graphType, getFormatPlotData])

  const layer = setConfigs(tableState.graphType)

  const config = {
    table: tableState.table as Table,
    layers: [layer],
  }

  const handleChange = (e: ChangeEvent<HTMLSelectElement>) => {
    setTableState((prev: StateConfig) => ({
      ...prev,
      graphType: e.target.value,
    }))
  }
  return (
    <>
      <select value={tableState.graphType} onChange={handleChange}>
        <option selected value="histogram">
          histogram
        </option>
        <option value="scatter">scatter</option>
      </select>
      <div style={style}>
        {tableState.table.length && <Plot config={config} />}
      </div>
    </>
  )
}

export default App
