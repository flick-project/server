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
    `SELECT u.type, u.movie_id, m.genre_ids, m.keyword_ids
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

  const movieIds = [...new Set(result.rows.map(r => r.movie_id))]
  const creditsResult = await pool.query(
    'SELECT movie_id, person_id, role FROM movie_credits WHERE movie_id = ANY($1)',
    [movieIds]
  )

  const creditsByMovie = {}
  for (const c of creditsResult.rows) {
    if (!creditsByMovie[c.movie_id]) creditsByMovie[c.movie_id] = []
    creditsByMovie[c.movie_id].push({ id: c.person_id, role: c.role })
  }

  const enrichedRows = result.rows.map(r => ({
    ...r,
    credits: creditsByMovie[r.movie_id] ?? []
  }))

  return buildScores(enrichedRows)
}

export const buildScores = (rows) => {
  const scores = { genres: {}, keywords: {}, people: {} }
  for (const row of rows) {
    const weight = recommendation.weights[row.type]
    row.genre_ids.forEach(id => { if (weight > 0) addScore(scores.genres, id, weight) })
    row.keyword_ids.forEach(id => addScore(scores.keywords, id, weight))
    row.credits?.forEach(({ id, role }) => {
      if (weight > 0) {
        const multiplier = role === 'director' ? 3 : 1
        addScore(scores.people, id, weight * multiplier)
      }
    })
  }
  return scores
}

const addScore = (target, key, weight) => {
  if (!key || weight === undefined || Number.isNaN(weight)) return
  target[key] = (target[key] || 0) + weight
}
