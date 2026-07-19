/**
 * @file Defines the recommendation model. Builds weighted preference profiles
 * from user signals (interactions, ratings, favorites) to drive discovery.
 * @module models/recommendationModel
 * @author Hans Nilsson
 */
import pool from '../config/db.js'
import { recommendation } from '../config/recommendation.js'

/**
 * Builds a weighted preference profile from a user's interactions, ratings, and favorites.
 * Limits preferences to the last N signals to keep the profile responsive to recent taste.
 * @param {number} userId - The user's ID.
 * @returns {Promise<object>} Weighted scores per genre, keyword, and person.
 */
export const findUserPreferences = async (userId) => {
  // Pull the user's most recent signals from interactions, ratings, and favorites.
  // Each signal carries a type that maps to a weight in the recommendation config.
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
    [userId, recommendation.recentWindow.interactions, recommendation.recentWindow.ratings]
  )

  // Fetch credits separately to avoid bloating the main query with joins and aggregation.
  const movieIds = [...new Set(result.rows.map(r => r.movie_id))]
  const creditsByMovie = {}

  if (movieIds.length > 0) {
    const creditsResult = await pool.query(
      'SELECT movie_id, person_id, role FROM movie_credits WHERE movie_id = ANY($1)',
      [movieIds]
    )
    for (const c of creditsResult.rows) {
      if (!creditsByMovie[c.movie_id]) creditsByMovie[c.movie_id] = []
      creditsByMovie[c.movie_id].push({ id: c.person_id, role: c.role })
    }
  }

  const enrichedRows = result.rows.map(r => ({
    ...r,
    credits: creditsByMovie[r.movie_id] ?? []
  }))

  const { scores, keywordCounts } = buildScores(enrichedRows)
  return { scores, keywordCounts }
}

/**
 * Aggregates weighted scores from signal rows into per-category preference maps.
 * Applies a distinct-movie threshold to keywords to prevent franchise pollution
 * (e.g. one disliked franchise dominating the negative keyword profile).
 * @param {object[]} rows - Signal rows including type, genre_ids, keyword_ids, credits.
 * @returns {object} Scores grouped by genres, keywords, and people.
 */
export const buildScores = (rows) => {
  const scores = { genres: {}, keywords: {}, people: {} }
  const keywordMovies = {}

  for (const row of rows) {
    const weight = recommendation.weights[row.type]

    // Genres only accumulate positive signals to avoid over-penalizing broad categories.
    row.genre_ids.forEach(id => { if (weight > 0) addScore(scores.genres, id, weight) })

    // Keywords accumulate both positive and negative signals (they're specific enough to matter).
    row.keyword_ids.forEach(id => {
      if (recommendation.keywordBlocklist.includes(id)) return
      addScore(scores.keywords, id, weight)
      if (!keywordMovies[id]) keywordMovies[id] = new Set()
      keywordMovies[id].add(row.movie_id)
    })

    // People only get positive signals - skipping a film shouldn't punish its entire cast.
    // Directors weigh more heavily than individual cast members since they shape the film's tone.
    row.credits?.forEach(({ id, role }) => {
      if (weight > 0) {
        const multiplier = role === 'director' ? 3 : 1
        addScore(scores.people, id, weight * multiplier)
      }
    })
  }

  // Once the user has enough signal history, drop keywords that only appear in a few movies.
  // This prevents single franchises from dominating the profile with niche keywords.
  if (rows.length >= recommendation.thresholdKicksInAt) {
    for (const [id, movieSet] of Object.entries(keywordMovies)) {
      if (movieSet.size < recommendation.keywordDistinctThreshold) {
        delete scores.keywords[id]
      }
    }
  }

  const keywordCounts = {}
  for (const [id, movieSet] of Object.entries(keywordMovies)) {
    keywordCounts[id] = movieSet.size
  }

  return { scores, keywordCounts }
}

/**
 * Adds a weighted score to a target map, skipping invalid keys or weights.
 * @param {object} target - The score map to mutate.
 * @param {string|number} key - The score key.
 * @param {number} weight - The weight to add.
 */
const addScore = (target, key, weight) => {
  if (!key || weight === undefined || Number.isNaN(weight)) return
  target[key] = (target[key] || 0) + weight
}
