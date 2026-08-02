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
 * Creates a rating only if one doesn't already exist.
 * @param {number} userId - The user's ID.
 * @param {number} movieId - The TMDB movie ID.
 * @param {string} rating - The rating (love, like, dislike, hate).
 * @returns {Promise<boolean>} True if created, false if skipped.
 */
export const createRatingIfAbsent = async (userId, movieId, rating) => {
  validate(rating)
  const validMovieId = validateTmdbId(movieId)

  const result = await pool.query(
    `INSERT INTO ratings (user_id, movie_id, rating)
     VALUES ($1, $2, $3)
     ON CONFLICT (user_id, movie_id) DO NOTHING
     RETURNING id`,
    [userId, validMovieId, rating]
  )
  return result.rows.length > 0
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

/**
 * Finds ratings that haven't been processed for pool enrichment.
 * @param {number} userId - The user's ID.
 * @param {number} limit - Max ratings to return.
 * @returns {Promise<Array>} Unprocessed ratings.
 */
export const findUnprocessed = async (userId, limit = 5) => {
  const result = await pool.query(
    `SELECT movie_id, rating FROM ratings
     WHERE user_id = $1 AND processed = false AND rating IN ('love', 'like')
     ORDER BY created_at DESC
     LIMIT $2`,
    [userId, limit]
  )
  return result.rows
}

/**
 * Marks a rating as processed for pool enrichment.
 * @param {number} userId - The user's ID.
 * @param {number} movieId - The TMDB movie ID.
 */
export const markProcessed = async (userId, movieId) => {
  await pool.query(
    'UPDATE ratings SET processed = true WHERE user_id = $1 AND movie_id = $2',
    [userId, movieId]
  )
}

/**
 * Get a user's rating for a movie.
 * @param {number} userId - The user's ID.
 * @param {number} movieId - The TMDB movie ID.
 * @returns {Promise<string|null>} The rating, or null if not rated.
 */
export const findUserRating = async (userId, movieId) => {
  const result = await pool.query(
    'SELECT rating FROM ratings WHERE user_id = $1 AND movie_id = $2',
    [userId, movieId]
  )
  return result.rows[0]?.rating ?? null
}
