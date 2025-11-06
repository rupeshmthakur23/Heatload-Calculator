// src/api/heatLoad/heatLoadApi.ts
import httpClient, { ApiResponse } from 'shared/utils/httpClient'
import { HeatLoadPayload, HeatLoadResponse } from './heatLoad.types'
import { getHeatLoadEndpoints } from './endpoints'

const {
  SAVE_HEAT_LOAD,
  LIST_HEAT_LOAD,
  GET_HEAT_LOAD,
  DEBUG,
} = getHeatLoadEndpoints()

export default class HeatLoadAPI {
  /** POST /heat-load — create or update a calculation (requires payload.quoteId) */
  static saveHeatLoad(data: HeatLoadPayload): ApiResponse<HeatLoadResponse> {
    return httpClient.post<HeatLoadResponse>(SAVE_HEAT_LOAD, data)
  }

  /** GET /heat-load — list all calculations for the current user */
  static listHeatLoads(): ApiResponse<HeatLoadResponse[]> {
    return httpClient.get<HeatLoadResponse[]>(LIST_HEAT_LOAD)
  }

  /** GET /heat-load/:id — fetch one calculation by its ID */
  static getHeatLoad(id: string): ApiResponse<HeatLoadResponse> {
    const path = GET_HEAT_LOAD.replace(':id', encodeURIComponent(id))
    return httpClient.get<HeatLoadResponse>(path)
  }

  /** GET /heat-load/debug — check that your JWT is being sent/parsed */
  static debug(): ApiResponse<{ ok: boolean; user: any }> {
    return httpClient.get<{ ok: boolean; user: any }>(DEBUG)
  }
}
