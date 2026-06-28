/**
 * @file Enricher that fetches TMDB recommendations for a movie.
 * @module services/enrichers/recommendationEnricher
 * @author Hans Nilsson
 */
import { fetchRecommendations, fetchMovieKeywords } from '../tmdbServices.js'
import { toPoolItem } from '../sources/tmdbMapper.js'

const ENRICH_LIMIT = 5

export const recommendationEnricher = {
  /**
   * Fetches TMDB recommendations for a movie and returns them as PoolItems.
   * Includes keywords on each item so the pool can filter by negative tags.
   * @param {number} userId - The user's ID.
   * @param {number} movieId - The TMDB movie ID to base recommendations on.
   * @returns {Promise<object[]>} The enriched PoolItems.
   */
  async enrich (userId, movieId) {
    const recommendations = await fetchRecommendations(movieId)
    const candidates = recommendations.filter(m => m.poster_path).slice(0, ENRICH_LIMIT)

    // Fetch keywords in parallel so pool can filter on tags.
    const withKeywords = await Promise.all(
      candidates.map(async (movie) => {
        const keywords = await fetchMovieKeywords(movie.id)
        return { ...movie, tags: keywords }
      })
    )

    return withKeywords.map(toPoolItem)
  }
}
