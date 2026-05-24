/**
 * @file Recommendation service for enriching the discovery pool.
 * @module services/recommendationService
 * @author Hans Nilsson
 */

import { fetchRecommendations } from './tmdbServices.js'
import { createMovie } from '../models/movieModel.js'
import { findUserPreferences } from '../models/recommendationModel.js'

/**
 * Fetches keywords and genre-filtered recommendations for a movie,
 * storing them in the database to enrich the discovery pool.
 * @param {number} userId - The user's ID.
 * @param {number} movieId - The TMDB movie ID.
 */
export const enrichPool = async (userId, movieId) => {
  // Build positive genre set from user's preference profile.
  const scores = await findUserPreferences(userId)
  const positiveGenres = new Set(
    Object.entries(scores.genres)
      .filter(([, score]) => score > 0)
      .map(([id]) => Number(id))
  )
  // Fetch and store TMDB recommendations that match the user's genre preferences.
  const recommendations = await fetchRecommendations(movieId, positiveGenres)
  for (const rec of recommendations) {
    await createMovie(rec)
  }
}
