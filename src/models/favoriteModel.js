/**
 * @file Defines the favorite model for user's favorite movies.
 * @module models/favoriteModel
 * @author Hans Nilsson
 * @version 0.1.0
 */

import pool from '../config/db.js'
import { createMovie } from './movieModel.js'

/**
 * Save a movie as a favorite for a user.
 * @param {number} userId - The user's ID.
 * @param {object} movie - The movie object from TMDB.
 */
export const createFavorite = async (userId, movie) => {
  await createMovie(movie)
  await pool.query(
    'INSERT INTO user_favorites (user_id, tmdb_id) VALUES ($1, $2) ON CONFLICT (user_id, tmdb_id) DO NOTHING',
    [userId, movie.id]
  )
}

/**
 * Gets a user's favorited movies.
 * @param {number} userId - The user's ID.
 * @returns {Promise<Array>} The user's favorite movies.
 */
export const findFavorites = async (userId) => {
  const result = await pool.query(
    `SELECT m.tmdb_id AS id, m.title, m.poster_path
     FROM user_favorites uf
     JOIN movies m ON uf.tmdb_id = m.tmdb_id
     WHERE uf.user_id = $1
     ORDER BY uf.created_at DESC`,
    [userId]
  )
  return result.rows
}
