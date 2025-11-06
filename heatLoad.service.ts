// src/routes/heatLoad/heatLoad.service.ts

import * as dao from './heatLoad.dao'
import { IHeatLoadCalculation } from '../../../models/heatLoad.model'
import APIError from '../../utils/APIError'

/** Apply business rules and forward to DAO. */
export const createHeatLoad = async (
  data: Partial<IHeatLoadCalculation>
): Promise<IHeatLoadCalculation> => {
 /*
  // Example validation: German postal code must be 5 digits
  if (!/^\d{5}$/.test(data.building?.postalCode ?? "")) {
    throw new APIError({ message: "Postal code must be 5 digits", status: 400 });
  }
  */
  return dao.createHeatLoad(data)
}

/** Ensure document belongs to this user. */
export const getHeatLoad = async (
  id: string,
  userId: string
): Promise<IHeatLoadCalculation> => {
  const doc = await dao.getHeatLoadById(id)

  // guard against `doc` or `doc.user` being undefined
  if (!doc || !doc.user || doc.user.toString() !== userId) {
    throw new APIError({ message: 'Not found or unauthorized', status: 404 })
  }

  return doc
}

/** List only this user’s calculations. */
export const listHeatLoads = async (
  userId: string
): Promise<IHeatLoadCalculation[]> => {
  return dao.listHeatLoadsByUser(userId)
}
