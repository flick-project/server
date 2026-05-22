/**
 * @file Defines the rating model.
 * @module models/ratingModel
 * @author Hans Nilsson
 */

import pool from '../config/db.js'
import { validateTmdbId } from '../utils/validation.js'

/**
 * Validate rating data before storing.
 * @param {object} rating - The rating.
 * @throws {Error} If validation fails.
 */
const validate = (rating) => {
  const validTypes = ['love', 'like', 'dislike', 'hate']

  if (!validTypes.includes(rating)) {
    const error = new Error('Invalid rating type')
    error.status = 400
    throw error
  }
}

/**
 * Creates or updates a rating.
 * @param {number} userId - The user's ID.
 * @param {number} movieId - The TMDB movie ID.
 * @param {string} rating - The rating (love, like, dislike, hate).
 * @returns {void}
 */
export const createRating = async (userId, movieId, rating) => {
  validate(rating)
  const validMovieId = validateTmdbId(movieId)

  const result = await pool.query(
    `INSERT INTO ratings (user_id, movie_id, rating)
    VALUES ($1, $2, $3)
    ON CONFLICT (user_id, movie_id)
    DO UPDATE SET rating = EXCLUDED.rating, updated_at = NOW()
    RETURNING rating, created_at, updated_at`,
    [userId, validMovieId, rating]
  )
  return result.rows[0]
}

/**
 * Remove a user's movie rating.
 * @param {number} userId - The user's ID.
 * @param {number} movieId - The rating to delete.
 * @returns {Promise<boolean>} True if deleted, false if nothing matched.
 */
export const removeRating = async (userId, movieId) => {
  const validMovieId = validateTmdbId(movieId)

  const result = await pool.query(
    `DELETE FROM ratings
    WHERE user_id = $1 AND movie_id = $2`,
    [userId, validMovieId]
  )

  return result.rowCount > 0
}
