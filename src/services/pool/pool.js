/**
 * @file The recommendation pool. Acts as the single gatekeeper for what enters
 * and exits the discovery flow, ensuring filtering, deduplication, and exploration.
 * @module services/pool/pool
 * @author Hans Nilsson
 */
import { create, addToUserPool, findFromPool, removeFromPool, pruneUserPool, countPool } from '../../models/movieModel.js'
import { findUserPreferences } from '../../models/recommendationModel.js'
import { recommendation } from '../../config/recommendation.js'

/**
 * Adds items to the pool after filtering them by the user's negative signals.
 * @param {number} userId - The user's ID.
 * @param {object[]} items - The PoolItems to add.
 * @param {string} [source] - The source of the movies ('discover' or 'enriched').
 * @param {object|null} [scores] - Pre-fetched preference scores. Fetched internally if not provided.
 * @returns {Promise<void>} Nothing.
 */
export const addToPool = async (userId, items, source = 'enriched', scores = null) => {
  const resolvedScores = scores ?? (await findUserPreferences(userId)).scores
  const filtered = filterItems(resolvedScores, items)
  for (const item of filtered) {
    await create(itemToMovie(item))
    await addToUserPool(userId, item.id, source)
  }
}

/**
 * Serves a batch of movies from the user's pool, prioritizing enriched sources.
 * Prunes stale entries before serving, then removes served movies from the pool.
 * @param {number} userId - The user's ID.
 * @param {number} [count] - Number of movies to return.
 * @param {object|null} [scores] - Pre-fetched preference scores. Fetched internally if not provided.
 * @returns {Promise<Array>} The served movies.
 */
export const servePool = async (userId, count = 20, scores = null) => {
  const resolvedScores = scores ?? (await findUserPreferences(userId)).scores
  await prunePool(userId, resolvedScores)
  const movies = await findFromPool(userId, count)
  if (movies.length > 0) {
    await removeFromPool(userId, movies.map(m => m.id))
  }
  return shuffle(movies)
}

/**
 * Removes pool entries that no longer pass the keyword score threshold.
 * Called before serving to ensure stale or newly disliked movies are dropped.
 * @param {number} userId - The user's ID.
 * @param {object} scores - The user's current preference scores.
 * @returns {Promise<void>} Nothing.
 */
const prunePool = async (userId, scores) => {
  const allMovies = await findFromPool(userId, 1000)
  const stale = allMovies
    .filter(movie => {
      const keywordScore = (movie.keyword_ids ?? []).reduce((sum, id) => {
        return sum + (scores.keywords[id] ?? 0)
      }, 0)
      return keywordScore < recommendation.keywordScoreThreshold
    })
    .map(m => m.id)
  await pruneUserPool(userId, stale)
}

/**
 * Counts the number of movies in the user's pool.
 * @param {number} userId - The user's ID.
 * @returns {Promise<number>} The count.
 */
export const countUndiscovered = async (userId) => {
  return countPool(userId)
}

/**
 * Shuffles an array in place using a basic random sort.
 * @param {Array} arr - The array to shuffle.
 * @returns {Array} The shuffled array.
 */
const shuffle = (arr) => arr.sort(() => Math.random() - 0.5)

/**
 * Filters out items whose net keyword score falls below the threshold.
 * Base discover items have empty tags (filtered via TMDB query params instead),
 * but enrichers fill tags so they can be filtered consistently here.
 * @param {object} scores - The user's preference scores.
 * @param {object[]} items - The PoolItems to filter.
 * @returns {object[]} The filtered items.
 */
const filterItems = (scores, items) => {
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
