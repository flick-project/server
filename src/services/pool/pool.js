/**
 * @file The recommendation pool. Acts as the single gatekeeper for what enters
 * and exits the discovery flow, ensuring filtering, deduplication, and exploration.
 * @module services/pool/pool
 * @author Hans Nilsson
 */
import { create, findUndiscovered, findRandomUndiscovered } from '../../models/movieModel.js'
import { findUserPreferences } from '../../models/recommendationModel.js'
import { recommendation } from '../../config/recommendation.js'

const RANDOM_RATIO = 0.2
const EXPLORATION_GENRE_LIMIT = 5

/**
 * Adds items to the pool after filtering them by the user's negative signals.
 * @param {number} userId - The user's ID.
 * @param {object[]} items - The PoolItems to add.
 */
export const addToPool = async (userId, items) => {
  const filtered = await filterItems(userId, items)
  for (const item of filtered) {
    await create(itemToMovie(item))
  }
}

/**
 * Serves a mixed batch of movies to the user. A portion is pulled from outside
 * the user's preferred genres to maintain exploration and avoid echo chambers.
 * @param {number} userId - The user's ID.
 * @param {number} [count] - Number of movies to return.
 * @returns {Promise<Array>} The served movies.
 */
export const servePool = async (userId, count = 20) => {
  const randomCount = Math.floor(count * RANDOM_RATIO)
  const baseCount = count - randomCount

  // Determine top genres so the exploration set can exclude them.
  const { scores } = await findUserPreferences(userId)
  const topGenres = Object.entries(scores.genres ?? {})
    .filter(([, score]) => score > 0)
    .sort((a, b) => b[1] - a[1])
    .slice(0, EXPLORATION_GENRE_LIMIT)
    .map(([id]) => Number(id))

  const [base, random] = await Promise.all([
    findUndiscovered(userId, baseCount),
    findRandomUndiscovered(userId, randomCount, topGenres)
  ])

  // Dedupe across base and exploration since both pull from the same table.
  const seen = new Set()
  const combined = [...base, ...random].filter(m => {
    if (seen.has(m.id)) return false
    seen.add(m.id)
    return true
  })

  return shuffle(combined)
}

/**
 * Shuffles an array in place using a basic random sort.
 * @param {Array} arr - The array to shuffle.
 * @returns {Array} The shuffled array.
 */
const shuffle = (arr) => arr.sort(() => Math.random() - 0.5)

/**
 * Filters out items whose tags overlap with the user's most disliked keywords.
 * Base discover items have empty tags (filtered via TMDB query params instead),
 * but enrichers fill tags so they can be filtered consistently here.
 * @param {number} userId - The user's ID.
 * @param {object[]} items - The PoolItems to filter.
 * @returns {Promise<object[]>} The filtered items.
 */
const filterItems = async (userId, items) => {
  const { scores } = await findUserPreferences(userId)
  return items.filter(item => {
    const keywordScore = item.tags.reduce((sum, tag) => {
      return sum + (scores.keywords[tag.id] ?? 0)
    }, 0)
    return keywordScore >= recommendation.keywordScoreThreshold
  })
}

/**
 * Maps a generic PoolItem back to the movie schema used by the database.
 * @param {object} item - The PoolItem.
 * @returns {object} The movie shape for persistence.
 */
const itemToMovie = (item) => ({
  id: item.id,
  title: item.title,
  poster_path: item.image,
  release_date: item.year,
  vote_average: item.score,
  vote_count: item.votes,
  overview: item.overview,
  genre_ids: item.genres
})
