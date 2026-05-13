/**
 * @file Defines the profile model.
 * @module models/profileModel
 * @author Hans Nilsson
 */

import pool from '../config/db.js'
import { createError } from '../utils/errors.js'

/**
 * Get basic profile info for a user.
 * @param {number} userId - The user's ID.
 * @returns {object} The user's display name, email, and creation date.
 */
export const findProfileInfo = async (userId) => {
  const result = await pool.query(
    'SELECT display_name, email, created_at FROM users WHERE id = $1',
    [userId]
  )
  if (!result.rows[0]) throw createError('No user found.', 404)
  return result.rows[0]
}
