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

  // Fetch keywords for all candidates in parallel.
  const keywordResults = await Promise.all(
    candidates.map(async (movie) => {
      const keywordIds = await fetchMovieKeywords(movie.id)
      return { id: movie.id, keywordIds }
    })
  )
  const keywordsByMovieId = Object.fromEntries(
    keywordResults.map(({ id, keywordIds }) => [id, keywordIds])
  )
  const filteredMovies = filterCandidates(candidates, keywordsByMovieId, negativeKeywords)

  // Save filtered movies and their keywords to the pool.
  await Promise.all(
    filteredMovies.map(async (movie) => {
      await createMovie(movie)
      await updateMovieKeywords(movie.id, keywordsByMovieId[movie.id])
    })
  )
}

/**
 * Filters recommendation candidates by removing movies with negative keywords.
 * @param {object[]} candidates - TMDB movie objects to filter.
 * @param {Map<number, number[]>} keywordsByMovieId - Map of movie ID to keyword IDs.
 * @param {Set<number>} negativeKeywords - Set of keyword IDs to exclude.
 * @returns {object[]} Candidates with no negative keyword matches.
 */
export const filterCandidates = (candidates, keywordsByMovieId, negativeKeywords) => {
  return candidates.filter(movie => {
    const keywords = keywordsByMovieId[movie.id] ?? []
    return !keywords.some(id => negativeKeywords.has(id))
  })
}
