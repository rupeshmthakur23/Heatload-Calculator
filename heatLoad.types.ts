// src/api/heatLoad/heatLoad.types.ts

// ***************
// Building-level
// ***************

export interface BuildingMetadata {
  postalCode: string
  address: string
  /** Free-form location (PLZ or city) for climate lookup */
  location?: string
  buildingType: string
  constructionYear: number
  renovationYear?: number
  ageClass?: string
  floors: number
  residents: number
  professionalInput?: boolean
  temperaturePreference: number
  oldHeatingType?: string
  oldHeatingYear?: number
  solarThermal?: boolean
  woodFireplace?: boolean
  /** EN values only */
  domesticHotWater?: 'instantaneous'|'boiler'|'combi'|'none'
  annualGasConsumption?: number
  annualElectricConsumption?: number
  buildingLength?: number
  buildingWidth?: number
  exteriorWallLength?: number
  aboveContext?: string
  belowContext?: string
  airtightnessTest?: boolean
  n50Value?: number
  groundDepth?: number
  /** EN values only */
  shielding?: 'none'|'low'|'medium'|'high'
  interiorWallToHeated?: boolean
  specialFeatures?: string
}

export interface PVHeatPumpSettings {
  hasPV: boolean
  pvKwp?: number
  hasHeatPump: boolean
  hpType?: 'air-water'|'ground-water'|'water-water'|'direct-evap'
  bufferTank: boolean
  bufferSizeLiters?: number
  brand?: string
  model?: string
  capacity?: number
}

// ****************************
// Envelope details (breakdown)
// ****************************

export interface EnvelopeElement {
  name: string
  layerRValues: number[]
  area: number
}

// ********************
// Room-level elements
// ********************

export interface WallDetail {
  id: string
  name: string
  type: string
  material: string
  customMaterial?: string
  /** inner vs outer wall */
  isExterior: boolean
  /** backend stores R-value; we send 1/U here */
  rValue: number
  area: number
  length: number
  /** kept optional for backward compatibility; we no longer set it */
  windowType?: string
}

export interface WindowDetail {
  id: string
  area: number
  type: string
  uValue: number
  orientation: 'North'|'East'|'South'|'West'
}

export interface DoorDetail {
  id: string
  area: number
  toUnheated: boolean
  uValue: number
}

export interface CeilingConfigType {
  area: number
  layerRValues: number[]
  insulationStandard: 'none'|'standard'|'passive'
  /** EN values only */
  roofType: 'flat'|'gable'|'hip'
  kneeWallHeight: number         // was kniestockHeight
  roofWindows: boolean           // was dachfenster
  dormers: boolean               // was gauben
}

export interface FloorConfigType {
  area: number
  layerRValues: number[]
  heated: boolean
  material: string
  insulated: boolean
  uValue: number
  /** EN values only */
  floorType: 'heated'|'unheated'|'ground'|'outside_air'
}

export interface VentilationConfigType {
  roomType: string
  targetTemp: number
  airExchangeRate: number
  ventilationSystem: boolean
  heatRecoveryEfficiency?: number
  internalGainsW?: number
}

export interface Heater {
  id: string
  type: 'radiator'|'underfloor'
  /** EN values only */
  subType?: 'panel'|'column'|'bath'
  height?: number
  width?: number
  output: number
  valveType: string
  roomTemp: number
  replacement?: boolean
  standardTemp?: number
  brand?: string
  series?: string
  pressureDrop?: number
}

/** Thermal bridge detail sent to backend */
export interface ThermalBridgeDetail {
  id: string
  name: string
  /** Ψ in W/(m·K) */
  psiValue: number
  /** length in meters */
  length: number
}

export interface Room {
  id: string
  name: string
  area: number
  height: number
  targetTemperature: number
  walls: WallDetail[]
  windows: WindowDetail[]
  doors: DoorDetail[]
  ceilingConfig: CeilingConfigType
  floorConfig: FloorConfigType
  ventilation?: VentilationConfigType
  heaters: Heater[]
  /** list of thermal bridges */
  thermalBridges?: ThermalBridgeDetail[]
  pvHeatPump?: PVHeatPumpSettings
}

export interface Floor {
  id: string
  name: string
  rooms: Room[]
}

// *************************
// Results (kW everywhere)
// *************************

/** All loads in kW */
export interface PerRoomLoad {
  roomId: string
  roomName: string
  transmissionLoss: number
  ventilationLoss: number
  thermalBridgeLoss: number
  safetyMargin: number
  /** final per-room heat load with TB + 10% margin */
  roomHeatLoad: number
  area: number
}

export interface CalculationResults {
  perRoomLoads: PerRoomLoad[]
  totalHeatLoadKW: number
}

// ***************
// API payloads
// ***************

export interface HeatLoadPayload {
  quoteId: string
  location?: string
  building: BuildingMetadata
  pvHeatPump: PVHeatPumpSettings
  envelopeElements: EnvelopeElement[]
  floors: Floor[]
  results: CalculationResults
}

export interface HeatLoadResponse {
  _id: string
  user: string
  quoteId: string
  building: BuildingMetadata
  pvHeatPump: PVHeatPumpSettings
  envelopeElements: EnvelopeElement[]
  floors: Floor[]
  results: CalculationResults
  createdAt: string
  updatedAt: string
}
