/**
 * @file Defines the movie model.
 * @module models/movieModel
 * @author Hans Nilsson
 * @version 0.1.0
 */

import pool from '../config/db.js'

/**
 * Validate movie data before storing.
 * @param {object} movie - The movie object from TMDB.
 * @throws {Error} If validation fails.
 */
const validate = (movie) => {
  if (!movie) {
    const error = new Error('Movie data is required.')
    error.status = 400
    throw error
  }

  if (!movie.id) {
    const error = new Error('Movie ID is required.')
    error.status = 400
    throw error
  }

  if (!movie.title) {
    const error = new Error('Movie title is required.')
    error.status = 400
    throw error
  }
}

/**
 * Creates new movie.
 * @param {object} movie - The movie to create.
 */
export const createMovie = async (movie) => {
  validate(movie)

  await pool.query(
    'INSERT INTO movies (tmdb_id, release_date, title, genre_ids, poster_path, vote_average, vote_count, overview) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) ON CONFLICT (tmdb_id) DO NOTHING',
    [movie.id, movie.release_date, movie.title, movie.genre_ids, movie.poster_path, movie.vote_average, movie.vote_count, movie.overview]
  )
}

export const getUndiscoveredMovies = async (userId) => {
  const result = await pool.query(
    'SELECT tmdb_id AS id, release_date, title, genre_ids, poster_path, vote_average, vote_count, overview FROM movies WHERE tmdb_id NOT IN (SELECT movie_id FROM movie_interactions WHERE user_id = $1) LIMIT 20',
    [userId]
  )
  return result.rows
}
