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
    r.rating,
    COUNT(*) OVER() AS total
    FROM movies m
    JOIN movie_interactions mi ON m.tmdb_id = mi.movie_id
    LEFT JOIN ratings r ON m.tmdb_id = r.movie_id AND r.user_id = $1
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
 * Removes a movie from the user's watchlist by deleting the saved interaction.
 * @param {number} userId - The user's ID.
 * @param {number} movieId - The TMDB movie ID.
 * @returns {boolean} True if the movie was removed, false if nothing matched.
 */
export const removeFromWatchlist = async (userId, movieId) => {
  validateTmdbId(movieId)
  const result = await pool.query(
    `DELETE FROM movie_interactions
    WHERE movie_id = $1 AND user_id = $2 AND interaction = 'saved'`,
    [movieId, userId]
  )
  return result.rowCount > 0
}

/**
 * Check if a movie is saved by the user.
 * @param {number} userId - The user's ID.
 * @param {number} movieId - The TMDB movie ID.
 * @returns {Promise<boolean>} True if saved.
 */
export const isSaved = async (userId, movieId) => {
  const result = await pool.query(
    `SELECT 1 FROM movie_interactions
    WHERE user_id = $1 AND movie_id = $2 AND interaction = 'saved'`,
    [userId, movieId]
  )
  return result.rows.length > 0
}

/**
 * Batch-checks which movies in a list the user has saved.
 * Used to hydrate discovery/watchlist responses with saved state.
 * @param {number} userId - The user's ID.
 * @param {number[]} movieIds - The TMDB movie IDs to check.
 * @returns {Promise<Set<number>>} Set of saved movie IDs.
 */
export const findSavedByIds = async (userId, movieIds) => {
  if (!movieIds.length) return new Set()
  const result = await pool.query(
    `SELECT movie_id FROM movie_interactions
     WHERE user_id = $1 AND movie_id = ANY($2) AND interaction = 'saved'`,
    [userId, movieIds]
  )
  return new Set(result.rows.map(r => r.movie_id))
}
