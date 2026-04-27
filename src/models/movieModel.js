/**
 * @file Defines the movie model.
 * @module models/movieModel
 * @author Hans Nilsson
 * @version 0.1.0
 */

import pool from '../config/db.js'

/**
 * Creates new movie.
 * @param {object} movie - The movie to create.
 */
export const createMovie = async (movie) => {
  await pool.query(
    'INSERT INTO movies (tmdb_id, release_date, title, genre_ids, poster_path, vote_average, vote_count, overview) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) ON CONFLICT (tmdb_id) DO NOTHING',
    [movie.id, movie.release_date, movie.title, movie.genre_ids, movie.poster_path, movie.vote_average, movie.vote_count, movie.overview]
  )
}
