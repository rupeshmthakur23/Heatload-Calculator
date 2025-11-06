import { Router } from 'express'
import { verifyAccessToken } from '../../middleware/verifyAccessToken'
import {
  debugHeatLoad,
  saveHeatLoad,
  listHeatLoads,
  getHeatLoad,
} from './heatLoad.controller'

const router = Router()
console.log('🔥 heat-load.routes.ts loaded')

// Sanity‐check endpoint
router.get('/debug', verifyAccessToken, debugHeatLoad)

// Create or update a heat‐load doc
router.post('/', verifyAccessToken, saveHeatLoad)

// List all for this user
router.get('/', verifyAccessToken, listHeatLoads)

// Fetch one by its ID
router.get('/:id', verifyAccessToken, getHeatLoad)

export default router
