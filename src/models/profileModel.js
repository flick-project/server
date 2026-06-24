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
 * Get interaction stats from a user.
 * @param {number} userId - The user's ID.
 * @returns {object} The user's interaction counts.
 */
export const findStats = async (userId) => {
  const result = await pool.query(
    `SELECT
    COUNT(*) AS total_interactions,
    COUNT(*) FILTER (WHERE interaction IN ('saved', 'removed')) AS total_saves,
    COUNT(*) FILTER (WHERE interaction = 'skipped') AS total_skips,
    COUNT(*) FILTER (WHERE interaction = 'seen') AS total_watched
    FROM movie_interactions
    WHERE user_id = $1`,
    [userId]
  )
  return result.rows[0]
}

export const findKeywordNames = async (keywordIds) => {
  if (keywordIds.length === 0) return {}
  const result = await pool.query(
    'SELECT id, name FROM keywords WHERE id = ANY($1)',
    [keywordIds]
  )
  return Object.fromEntries(result.rows.map(r => [r.id, r.name]))
}
