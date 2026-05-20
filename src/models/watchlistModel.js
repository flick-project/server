/**
 * @file Defines the interaction model for user-movie interactions.
 * @module models/watchlistModel
 * @author Hans Nilsson
 */

import pool from '../config/db.js'
import { validateTmdbId } from '../utils/validation.js'

const validatePageNumber = (page) => {
  const pageNumber = Math.floor(Number(page))
  if (!pageNumber || pageNumber < 1) return 1
  return pageNumber
}

const validateLimitNumber = (limit, max = 50) => {
  const limitNumber = Math.floor(Number(limit))
  if (!limitNumber || limitNumber < 1) return 20
  return limitNumber > max ? max : limitNumber
}

/**
 * Get saved movies for a user, ordered by most recently saved.
 * Also returns the amount of movies the user has saved.
 * @param {number} userId - The user's ID.
 * @param {number|string} [page] - The page number. Defaults to 1.
 * @param {number} limit - The amount of movies to show per page.
 * @returns {Promise<Array>} The saved movies and their count.
 */
export const findWatchlist = async (userId, page, limit) => {
  const pageNumber = validatePageNumber(page)
  const limitNumber = validateLimitNumber(limit)
  const offset = (pageNumber - 1) * limitNumber

  const result = await pool.query(
    `SELECT m.tmdb_id, m.title, m.poster_path,
    COUNT(*) OVER() AS total
    FROM movies m
    JOIN movie_interactions mi ON m.tmdb_id = mi.movie_id
    WHERE mi.user_id = $1
    AND mi.interaction = 'saved'
    ORDER BY mi.created_at DESC
    LIMIT $2
    OFFSET $3`,
    [userId, limitNumber, offset]
  )
  const total = result.rows[0]?.total ?? 0
  return { movies: result.rows, total: Number(total) }
}

/**
 * Removes a movie from the user's watchlist.
 * @param {number} userId - The user's ID.
 * @param {number} movieId - The TMDB movie ID.
 * @returns {boolean} True if the movie was removed, false if nothing matched.
 */
export const removeFromWatchlist = async (userId, movieId) => {
  validateTmdbId(movieId)
  const result = await pool.query(
    `UPDATE movie_interactions
    SET interaction = 'removed'
    WHERE movie_id = $1 AND user_id = $2 AND interaction = 'saved'`,
    [movieId, userId]
  )
  return result.rowCount > 0
}
