/**
 * @file Recommendation service for enriching the discovery pool.
 * @module services/recommendationService
 * @author Hans Nilsson
 */

import { fetchMovieKeywords, fetchRecommendations } from './tmdbServices.js'
import { createMovie, updateMovieKeywords } from '../models/movieModel.js'
import { findUserPreferences } from '../models/recommendationModel.js'
import { recommendation } from '../config/recommendation.js'

/**
 * Fetches keywords and filtered recommendations for a movie,
 * storing them in the database to enrich the discovery pool.
 * @param {number} userId - The user's ID.
 * @param {number} movieId - The TMDB movie ID.
 */
export const enrichPool = async (userId, movieId) => {
  const scores = await findUserPreferences(userId)
  const negativeKeywords = new Set(
    Object.entries(scores.keywords)
      .filter(([, score]) => score < 0)
      .sort((a, b) => a[1] - b[1])
      .slice(0, recommendation.negativeKeywordLimit)
      .map(([id]) => Number(id))
  )
  // Fetch recommendations and take the first 5.
  const recommendations = await fetchRecommendations(movieId)
  const candidates = recommendations.slice(0, 5)
  let stored = 0
  // Fetch keywords for each candidate and filter by negative keywords.
  for (const movie of candidates) {
    const keywordIds = await fetchMovieKeywords(movie.id)
    const hasNegativeKeyword = keywordIds.some(id => negativeKeywords.has(id))
    if (!hasNegativeKeyword) {
      await createMovie(movie)
      await updateMovieKeywords(movie.id, keywordIds)
      stored++
    } else {
      // console.log('Filtered out:', movie.title, '| Negative keyword match')
    }
  }
  console.log('Negative keywords:', [...negativeKeywords])
  console.log('enrichPool:', movieId, '| Candidates:', candidates.length, '| Stored:', stored)
}
