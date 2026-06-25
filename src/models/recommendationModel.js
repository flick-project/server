/**
 * @file Defines the recommendation model.
 * @module models/recommendationModel
 * @author Hans Nilsson
 */
import pool from '../config/db.js'
import { recommendation } from '../config/recommendation.js'

/**
 * Builds a weighted preference profile from a user's interactions, ratings, and favorites.
 * Limit preferences to their last x amount of interactions and ratings to prevent clustering.
 * @param {number} userId - The user's ID.
 * @returns {Promise<object>} Weighted scores per genre and keyword.
 */
export const findUserPreferences = async (userId) => {
  const result = await pool.query(
    `SELECT u.type, m.genre_ids, m.keyword_ids
    FROM (
      SELECT movie_id, interaction AS type FROM (
        SELECT movie_id, interaction, created_at
        FROM movie_interactions
        WHERE user_id = $1
        ORDER BY created_at DESC
        LIMIT $2
      ) mi
      UNION ALL
      SELECT movie_id, rating AS type FROM (
        SELECT movie_id, rating, updated_at
        FROM ratings
        WHERE user_id = $1
        ORDER BY updated_at DESC
        LIMIT $3
      ) r
      UNION ALL
      SELECT movie_id, 'favorite' AS type
      FROM favorites
      WHERE user_id = $1
    ) u
    JOIN movies m ON m.tmdb_id = u.movie_id`,
    [userId, recommendation.interactionWindow, recommendation.ratingWindow]
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
