/**
 * @file Defines the watched model for tracking movies a user has seen.
 * @module models/watchedModel
 * @author Hans Nilsson
 */
import pool from '../config/db.js'

/**
 * Marks a movie as watched for a user. No-ops if already marked.
 * @param {number} userId - The user's ID.
 * @param {number} movieId - The TMDB movie ID.
 */
export const markWatched = async (userId, movieId) => {
  await pool.query(
    `INSERT INTO watched (user_id, movie_id)
     VALUES ($1, $2)
     ON CONFLICT (user_id, movie_id) DO NOTHING`,
    [userId, movieId]
  )
}

/**
 * Removes a movie's watched mark for a user.
 * @param {number} userId - The user's ID.
 * @param {number} movieId - The TMDB movie ID.
 */
export const unmarkWatched = async (userId, movieId) => {
  await pool.query(
    'DELETE FROM watched WHERE user_id = $1 AND movie_id = $2',
    [userId, movieId]
  )
}

/**
 * Removes the watched mark for multiple movies for a user.
 * @param {number} userId - The user's ID.
 * @param {number[]} movieIds - The TMDB movie IDs to unmark.
 */
export const unmarkWatchedMany = async (userId, movieIds) => {
  if (!movieIds.length) return
  await pool.query(
    'DELETE FROM watched WHERE user_id = $1 AND movie_id = ANY($2)',
    [userId, movieIds]
  )
}

/**
 * Checks whether a user has marked a movie as watched.
 * @param {number} userId - The user's ID.
 * @param {number} movieId - The TMDB movie ID.
 * @returns {Promise<boolean>} True if watched.
 */
export const isWatched = async (userId, movieId) => {
  const result = await pool.query(
    'SELECT 1 FROM watched WHERE user_id = $1 AND movie_id = $2',
    [userId, movieId]
  )
  return result.rows.length > 0
}

/**
 * Finds which of the given movie IDs a user has marked as watched.
 * @param {number} userId - The user's ID.
 * @param {number[]} movieIds - The TMDB movie IDs to check.
 * @returns {Promise<Set<number>>} Set of watched movie IDs.
 */
export const findWatchedByIds = async (userId, movieIds) => {
  const result = await pool.query(
    'SELECT movie_id FROM watched WHERE user_id = $1 AND movie_id = ANY($2)',
    [userId, movieIds]
  )
  return new Set(result.rows.map(r => r.movie_id))
}

/**
 * Lists a user's watched movies with details, most recently watched first.
 * @param {number} userId - The user's ID.
 * @returns {Promise<Array>} The watched movies.
 */
export const findWatched = async (userId) => {
  const result = await pool.query(
    `SELECT m.tmdb_id AS id, m.title, m.poster_path, m.release_date,
            m.vote_average, w.created_at AS watched_at
     FROM watched w
     JOIN movies m ON m.tmdb_id = w.movie_id
     WHERE w.user_id = $1
     ORDER BY w.created_at DESC`,
    [userId]
  )
  return result.rows
}
