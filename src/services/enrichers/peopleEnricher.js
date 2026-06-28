/**
 * @file Enricher that fetches movies featuring the user's top people.
 * @module services/enrichers/peopleEnricher
 * @author Hans Nilsson
 */
import { discoverMovies, fetchMovieKeywords } from '../tmdbServices.js'
import { findUserPreferences } from '../../models/recommendationModel.js'

const ENRICH_LIMIT = 5
const TOP_PEOPLE_COUNT = 3

/**
 * Maps a TMDB movie object to the generic PoolItem format.
 * @param {object} movie - The TMDB movie.
 * @returns {object} The mapped PoolItem.
 */
const toPoolItem = (movie) => ({
  id: movie.id,
  title: movie.title,
  image: movie.poster_path,
  year: movie.release_date,
  score: movie.vote_average,
  votes: movie.vote_count,
  overview: movie.overview,
  genres: movie.genre_ids ?? [],
  tags: movie.tags ?? []
})

export const peopleEnricher = {
  /**
   * Fetches movies featuring the user's top-scored people and returns them as PoolItems.
   * @param {number} userId - The user's ID.
   * @returns {Promise<object[]>} The enriched PoolItems.
   */
  async enrich (userId) {
    const scores = await findUserPreferences(userId)
    const topPeople = Object.entries(scores.people ?? {})
      .sort((a, b) => b[1] - a[1])
      .slice(0, TOP_PEOPLE_COUNT)
      .map(([id]) => id)

    if (!topPeople.length) return []

    const { results } = await discoverMovies(1, { with_people: topPeople.join('|') })
    const candidates = results.filter(m => m.poster_path).slice(0, ENRICH_LIMIT)

    const withKeywords = await Promise.all(
      candidates.map(async (movie) => {
        const keywords = await fetchMovieKeywords(movie.id)
        return { ...movie, tags: keywords }
      })
    )

    return withKeywords.map(toPoolItem)
  }
}
