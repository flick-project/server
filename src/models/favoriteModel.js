/**
 * @file Defines the favorite model for user's favorite movies.
 * @module models/favoriteModel
 * @author Hans Nilsson
 */

import pool from '../config/db.js'
import { validateTmdbId } from '../utils/validation.js'
import { createError } from '../utils/errors.js'

/**
 * Save a movie as a favorite for a user.
 * @param {number} userId - The user's ID.
 * @param {object} movie - The movie object from TMDB.
 * @returns {Promise<boolean>} True if inserted, false if duplicate.
 * @throws {Error} 403 if the user already has 5 favorites.
 */
export const createFavorite = async (userId, movie) => {
  const countResult = await pool.query(
    'SELECT COUNT(*) FROM favorites WHERE user_id = $1',
    [userId]
  )
  if (Number(countResult.rows[0].count) >= 5) {
    throw createError('Favorite limit reached.', 403)
  }
  const result = await pool.query(
    'INSERT INTO favorites (user_id, movie_id) VALUES ($1, $2) ON CONFLICT (user_id, movie_id) DO NOTHING',
    [userId, movie.id]
  )
  return result.rowCount > 0
}

/**
 * Gets a user's favorited movies.
 * @param {number} userId - The user's ID.
 * @returns {Promise<Array>} The user's favorite movies.
 */
export const findFavorites = async (userId) => {
  const result = await pool.query(
    `SELECT m.tmdb_id AS id, m.title, m.release_date, m.poster_path
     FROM favorites f
     JOIN movies m ON f.movie_id = m.tmdb_id
     WHERE f.user_id = $1
     ORDER BY f.created_at ASC`,
    [userId]
  )
  return result.rows
}

/**
 * Remove a user's favorited movie.
 * @param {number} userId - The user's ID.
 * @param {number} movieId - The favorite to delete.
 * @returns {Promise<boolean>} True if deleted, false if nothing matched.
 */
export const removeFavorite = async (userId, movieId) => {
  const validMovieId = validateTmdbId(movieId)

  const result = await pool.query(
    `DELETE FROM favorites
    WHERE user_id = $1 AND movie_id = $2`,
    [userId, validMovieId]
  )

  return result.rowCount > 0
}
