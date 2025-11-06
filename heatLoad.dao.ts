import { HeatLoadCalculation, IHeatLoadCalculation } from '../../../models/heatLoad.model'

/** Create or update (upsert) a heat-load document per {user, quoteId}. */
export const createHeatLoad = async (
  payload: Partial<IHeatLoadCalculation>
): Promise<IHeatLoadCalculation> => {
  if (!payload?.user || !payload?.quoteId) {
    // Let Mongoose validation also complain, but guard early
    throw new Error('createHeatLoad requires user and quoteId')
  }

  const filter = { user: payload.user, quoteId: payload.quoteId }
  const update = {
    $set: {
      building:         payload.building,
      pvHeatPump:       payload.pvHeatPump,
      envelopeElements: payload.envelopeElements,
      floors:           payload.floors,
      results:          payload.results,
    },
    $setOnInsert: {
      user:    payload.user,
      quoteId: payload.quoteId,
    },
  }

  return HeatLoadCalculation
    .findOneAndUpdate(filter, update, { new: true, upsert: true, runValidators: true })
    .exec()
}

/** Fetch one by its ID. */
export const getHeatLoadById = async (
  id: string
): Promise<IHeatLoadCalculation | null> => {
  return HeatLoadCalculation.findById(id).exec()
}

/** List all calculations belonging to a user (newest first). */
export const listHeatLoadsByUser = async (
  userId: string
): Promise<IHeatLoadCalculation[]> => {
  return HeatLoadCalculation
    .find({ user: userId })
    .sort({ updatedAt: -1 })
    .exec()
}
