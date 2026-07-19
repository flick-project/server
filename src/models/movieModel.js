/**
 * @file Defines the movie model.
 * @module models/movieModel
 * @author Hans Nilsson
 */
import pool from '../config/db.js'
import { findMovie } from '../services/tmdbServices.js'

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
 * Ensures a movie exists in the database, fetching from TMDB if missing.
 * @param {number} movieId - The TMDB movie ID.
 */
export const ensureExists = async (movieId) => {
  const result = await pool.query('SELECT 1 FROM movies WHERE tmdb_id = $1', [movieId])
  if (result.rows.length > 0) return

  const movie = await findMovie(movieId)
  movie.genre_ids = movie.genres.map(g => g.id)
  await create(movie)
}

/**
 * Creates new movie.
 * @param {object} movie - The movie to create.
 */
export const create = async (movie) => {
  validate(movie)
  await pool.query(
    'INSERT INTO movies (tmdb_id, release_date, title, genre_ids, poster_path, vote_average, vote_count, overview) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) ON CONFLICT (tmdb_id) DO NOTHING',
    [movie.id, movie.release_date, movie.title, movie.genre_ids, movie.poster_path, movie.vote_average, movie.vote_count, movie.overview]
  )
}

/**
 * Stores keyword IDs for a movie and caches keyword names.
 * @param {number} movieId - The TMDB movie ID.
 * @param {Array<{id: number, name: string}>} keywords - The keywords from TMDB.
 */
export const storeKeywords = async (movieId, keywords) => {
  const keywordIds = keywords.map(k => k.id)

  await pool.query(
    `UPDATE movies SET keyword_ids = $1
    WHERE tmdb_id = $2 AND keyword_ids = '{}'`,
    [keywordIds, movieId]
  )

  if (keywords.length === 0) return

  const values = keywords.map((_, i) => `($${i * 2 + 1}, $${i * 2 + 2})`).join(', ')
  const params = keywords.flatMap(k => [k.id, k.name])

  await pool.query(
    `INSERT INTO keywords (id, name) VALUES ${values} ON CONFLICT (id) DO NOTHING`,
    params
  )
}

/**
 * Stores credits (director + top cast) for a movie.
 * @param {number} movieId - The TMDB movie ID.
 * @param {Array<{id: number, name: string, role: string}>} credits - The credits.
 */
export const storeCredits = async (movieId, credits) => {
  if (credits.length === 0) return
  const values = credits.map((_, i) => `($${i * 4 + 1}, $${i * 4 + 2}, $${i * 4 + 3}, $${i * 4 + 4})`).join(', ')
  const params = credits.flatMap(c => [movieId, c.id, c.name, c.role])
  await pool.query(
    `INSERT INTO movie_credits (movie_id, person_id, name, role) VALUES ${values} ON CONFLICT (movie_id, person_id) DO NOTHING`,
    params
  )
}

/**
 * Adds a movie to the user's pool with a source tag.
 * @param {number} userId - The user's ID.
 * @param {number} movieId - The TMDB movie ID.
 * @param {string} source - The source of the movie ('discover' or 'enriched').
 */
export const addToUserPool = async (userId, movieId, source) => {
  await pool.query(
    `INSERT INTO user_pool (user_id, movie_id, source)
     VALUES ($1, $2, $3)
     ON CONFLICT (user_id, movie_id) DO NOTHING`,
    [userId, movieId, source]
  )
}

/**
 * Serves movies from the user's pool, prioritizing enriched sources.
 * @param {number} userId - The user's ID.
 * @param {number} count - Number of movies to return.
 * @returns {Promise<Array>} The pool movies.
 */
export const findFromPool = async (userId, count) => {
  const result = await pool.query(
    `SELECT m.tmdb_id AS id, m.release_date, m.title, m.genre_ids, m.keyword_ids,
            m.poster_path, m.vote_average, m.vote_count, m.overview,
            p.source
     FROM user_pool p
     JOIN movies m ON m.tmdb_id = p.movie_id
     WHERE p.user_id = $1
     AND m.tmdb_id NOT IN (SELECT movie_id FROM movie_interactions WHERE user_id = $1 AND interaction != 'removed')
     AND m.tmdb_id NOT IN (SELECT movie_id FROM ratings WHERE user_id = $1)
     AND m.tmdb_id NOT IN (SELECT movie_id FROM favorites WHERE user_id = $1)
     ORDER BY CASE WHEN p.source = 'enriched' THEN 0 ELSE 1 END, p.created_at ASC
     LIMIT $2`,
    [userId, count]
  )
  return result.rows
}

/**
 * Removes specific movies from the user's pool by ID.
 * @param {number} userId - The user's ID.
 * @param {number[]} movieIds - The TMDB movie IDs to remove.
 * @returns {Promise<void>} Nothing.
 */
export const pruneUserPool = async (userId, movieIds) => {
  if (!movieIds.length) return
  await pool.query(
    'DELETE FROM user_pool WHERE user_id = $1 AND movie_id = ANY($2)',
    [userId, movieIds]
  )
}

/**
 * Removes movies from the user's pool after they've been served.
 * @param {number} userId - The user's ID.
 * @param {number[]} movieIds - The TMDB movie IDs to remove.
 */
export const removeFromPool = async (userId, movieIds) => {
  await pool.query(
    'DELETE FROM user_pool WHERE user_id = $1 AND movie_id = ANY($2)',
    [userId, movieIds]
  )
}

/**
 * Counts the number of movies in the user's pool.
 * @param {number} userId - The user's ID.
 * @returns {Promise<number>} The count.
 */
export const countPool = async (userId) => {
  const result = await pool.query(
    `SELECT COUNT(*) FROM user_pool p
     WHERE p.user_id = $1
     AND p.movie_id NOT IN (SELECT movie_id FROM movie_interactions WHERE user_id = $1 AND interaction != 'removed')
     AND p.movie_id NOT IN (SELECT movie_id FROM ratings WHERE user_id = $1)
     AND p.movie_id NOT IN (SELECT movie_id FROM favorites WHERE user_id = $1)`,
    [userId]
  )
  return parseInt(result.rows[0].count, 10)
}
