// src/routes/heatLoad/heatLoad.controller.ts
import { Request, Response, NextFunction } from 'express'
import mongoose from 'mongoose'
import * as heatLoadService from './heatLoad.service'
import APIError from '../../utils/APIError'

/**
 * We expect your auth middleware to have done:
 *    req.headers['user'] = decodedJwtPayload
 */
interface AuthenticatedRequest extends Request {
  headers: Request['headers'] & { user?: any }
}

/** Safely get an HTTP status from unknown error shapes */
const statusOf = (err: unknown, fallback = 400): number => {
  const e: any = err as any
  const s =
    e?.status ??
    e?.statusCode ??
    e?.httpCode ??
    e?.code // occasionally people stash numeric codes here
  return Number.isInteger(s) ? Number(s) : fallback
}

/**
 * Sanity-check endpoint – echoes the parsed user object
 * (must be mounted after your auth middleware)
 */
export const debugHeatLoad = (
  req: AuthenticatedRequest,
  res: Response
) => {
  const user = req.headers['user'] as any
  console.log(' req.headers["user"]:', user)
  return res.json({ ok: true, user })
}

/** POST /api/heat-load */
export const saveHeatLoad = async (
  req: AuthenticatedRequest,
  res: Response,
  _next: NextFunction
) => {
  try {
    // 1) extract user from headers
    const userHeader = req.headers['user'] as any
    const userId = userHeader?._id ?? userHeader?.id

    if (!userId) {
      return res.status(401).json({
        code: 401,
        message: 'Unauthorized: user missing from request. Are you logged in?',
      })
    }

    // 2) pull in your payload
    const {
      quoteId,
      building,
      pvHeatPump,
      envelopeElements,
      floors,
      results,
    } = req.body as {
      quoteId: string
      building: any
      pvHeatPump: any
      envelopeElements: any[]
      floors: any[]
      results: any
    }

    if (!quoteId) {
      return res.status(400).json({
        code: 400,
        message: 'Missing quoteId in request body.',
      })
    }

    // 3) cast to ObjectId
    const objectQuoteId = new mongoose.Types.ObjectId(quoteId)

    // 4) assemble service payload
    const payload = {
      user: new mongoose.Types.ObjectId(userId),
      quoteId: objectQuoteId,
      building,
      pvHeatPump,
      envelopeElements,
      floors,
      results,
    }

    // 5) upsert (create or update existing {user, quoteId})
    const doc = await heatLoadService.createHeatLoad(payload)
    return res.status(201).json({ code: 201, data: doc, message: 'Saved' })
  } catch (error) {
    console.error('🔥 Error in saveHeatLoad:', error)
    if (error instanceof APIError) {
      const status = statusOf(error, 400)
      return res.status(status).json({ code: status, message: error.message })
    }
    if (error instanceof Error) {
      return res.status(500).json({
        code: 500,
        message: 'Internal Server Error',
        error: error.message,
        stack: error.stack,
      })
    }
    return res.status(500).json({
      code: 500,
      message: 'Internal Server Error',
      error: String(error),
      stack: undefined,
    })
  }
}

/** GET /api/heat-load */
export const listHeatLoads = async (
  req: AuthenticatedRequest,
  res: Response,
  _next: NextFunction
) => {
  try {
    const userHeader = req.headers['user'] as any
    const userId = userHeader?._id ?? userHeader?.id
    if (!userId) {
      return res.status(401).json({
        code: 401,
        message: 'Unauthorized: user missing from request. Are you logged in?',
      })
    }

    const docs = await heatLoadService.listHeatLoads(userId)
    return res.json({ code: 200, data: docs })
  } catch (error) {
    console.error('🔥 Error in listHeatLoads:', error)
    if (error instanceof APIError) {
      const status = statusOf(error, 400)
      return res.status(status).json({ code: status, message: error.message })
    }
    if (error instanceof Error) {
      return res.status(500).json({
        code: 500,
        message: 'Internal Server Error',
        error: error.message,
        stack: error.stack,
      })
    }
    return res.status(500).json({
      code: 500,
      message: 'Internal Server Error',
      error: String(error),
      stack: undefined,
    })
  }
}

/** GET /api/heat-load/:id */
export const getHeatLoad = async (
  req: AuthenticatedRequest,
  res: Response,
  _next: NextFunction
) => {
  try {
    const userHeader = req.headers['user'] as any
    const userId = userHeader?._id ?? userHeader?.id
    if (!userId) {
      return res.status(401).json({
        code: 401,
        message: 'Unauthorized: user missing from request. Are you logged in?',
      })
    }

    const doc = await heatLoadService.getHeatLoad(req.params.id, userId)
    return res.json({ code: 200, data: doc })
  } catch (error) {
    console.error('🔥 Error in getHeatLoad:', error)
    if (error instanceof APIError) {
      const status = statusOf(error, 400)
      return res.status(status).json({ code: status, message: error.message })
    }
    if (error instanceof Error) {
      return res.status(500).json({
        code: 500,
        message: 'Internal Server Error',
        error: error.message,
        stack: error.stack,
      })
    }
    return res.status(500).json({
      code: 500,
      message: 'Internal Server Error',
      error: String(error),
      stack: undefined,
    })
  }
}
