/**
 * @file Defines the recommendation model.
 * @module models/recommendationModel
 * @author Hans Nilsson
 */
import pool from '../config/db.js'
import { recommendation } from '../config/recommendation.js'

/**
 * Builds a weighted preference profile from a user's interactions, ratings, and favorites.
 * @param {number} userId - The user's ID.
 * @returns {Promise<object>} Weighted scores per genre and keyword.
 */
export const findUserPreferences = async (userId) => {
  const result = await pool.query(
    `SELECT u.type, m.genre_ids, m.keyword_ids
    FROM (
      SELECT mi.movie_id, mi.interaction AS type
      FROM movie_interactions mi
      WHERE mi.user_id = $1
      UNION ALL
      SELECT r.movie_id, r.rating AS type
      FROM ratings r
      WHERE r.user_id = $1
      UNION ALL
      SELECT f.movie_id, 'favorite' AS type
      FROM favorites f
      WHERE f.user_id = $1
    ) u
    JOIN movies m ON m.tmdb_id = u.movie_id`,
    [userId]
  )
  return buildScores(result.rows)
}

export const buildScores = (rows) => {
  const scores = { genres: {}, keywords: {} }
  for (const row of rows) {
    const weight = recommendation.weights[row.type]
    row.genre_ids.forEach(id => { if (weight > 0) addScore(scores.genres, id, weight) })
    row.keyword_ids.forEach(id => addScore(scores.keywords, id, weight))
  }
  return scores
}

const addScore = (target, key, weight) => {
  if (!key || weight === undefined || Number.isNaN(weight)) return
  target[key] = (target[key] || 0) + weight
}
