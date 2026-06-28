/**
 * @file Recommendation service for processing user signals and triggering enrichment.
 * @module services/recommendationService
 * @author Hans Nilsson
 */
import { storeKeywords, storeCredits } from '../models/movieModel.js'
import { fetchMovieKeywords, fetchMovieCredits } from './tmdbServices.js'
import { addToPool } from './pool/pool.js'
import { recommendationEnricher } from './enrichers/recommendationEnricher.js'
import { peopleEnricher } from './enrichers/peopleEnricher.js'

/**
 * Processes a movie signal by storing keywords and credits, and optionally
 * triggering pool enrichment in the background.
 * Should be called after any meaningful user-movie interaction (save, rate, favorite).
 * @param {number} userId - The user's ID.
 * @param {number} movieId - The TMDB movie ID.
 * @param {object} [options] - Optional behaviour flags.
 * @param {boolean} [options.enrich] - Whether to enrich the pool with recommendations.
 * @param {boolean} [options.awaitEnrich] - Whether to await enrichment (e.g. during onboarding).
 */
export const processMovieSignal = async (userId, movieId, { enrich = false, awaitEnrich = false } = {}) => {
  const [keywords, credits] = await Promise.all([
    fetchMovieKeywords(movieId),
    fetchMovieCredits(movieId)
  ])
  await storeKeywords(movieId, keywords)
  await storeCredits(movieId, credits)

  if (enrich) {
    const job = (async () => {
      const [recItems, peopleItems] = await Promise.all([
        recommendationEnricher.enrich(userId, movieId),
        peopleEnricher.enrich(userId)
      ])
      await addToPool(userId, [...recItems, ...peopleItems])
    })().catch(console.error)
    if (awaitEnrich) await job
  }
}
