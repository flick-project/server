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
  if (!result.rows[0]) throw createError('User not found.', 404)
  return result.rows[0]
}

/**
 * Get stats from the user.
 * @param {number} userId - The user's ID.
 * @returns {object} The user's swipes and saves.
 */
export const findStats = async (userId) => {
  const result = await pool.query(
    `SELECT 
    COUNT(*) AS total_swipes,
    COUNT(*) FILTER (WHERE interaction = 'saved') AS total_saves
    FROM movie_interactions 
    WHERE user_id = $1`,
    [userId]
  )
  return result.rows[0]
}
