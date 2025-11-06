/** Single source of truth for your Heat-Load API paths */
export const HeatLoadEndpoints = {
  SAVE_HEAT_LOAD: '/heat-load',
  LIST_HEAT_LOAD: '/heat-load',
  GET_HEAT_LOAD:  '/heat-load/:id',
  DEBUG:         '/heat-load/debug',
} as const

export type HeatLoadEndpointKey = keyof typeof HeatLoadEndpoints

export function getHeatLoadEndpoints() {
  return HeatLoadEndpoints
}
