/**
 * @file Movie controller for handling movie suggestions.
 * @module controllers/api/MovieController
 * @author Hans Nilsson
 */

import { BaseController } from './BaseController.js'
import { discoverMovies, searchMovies, fetchMovieKeywords } from '../../services/tmdbServices.js'
import { createMovie, findUndiscoveredMovies, updateMovieKeywords } from '../../models/movieModel.js'
import { createInteraction } from '../../models/interactionModel.js'
import { recommendation } from '../../config/recommendation.js'
import { findUserPreferences } from '../../models/recommendationModel.js'
import { findDiscoverProgress, setDiscoverProgress } from '../../models/userModel.js'

const DISCOVER_POOL = 20

export class MovieController extends BaseController {
  /**
   * Fetches a list of movies for discovery.
   * If the user is authenticated, it fetches movies they haven't interacted with yet.
   * If the pool of undiscovered movies is low, it fetches more from TMDB and stores them in the database.
   * @param {object} req - Express's request object.
   * @param {object} res - Express's response object.
   * @param {(error: Error) => void} next - Express's next function to pass the error to the error-handling middleware.
   */
  async discover (req, res, next) {
    try {
      let movies = []
      if (req.user) {
        movies = await findUndiscoveredMovies(req.user.id)
      }
      if (movies.length < DISCOVER_POOL) {
        let filters = null
        let page = 1
        if (req.user) {
          const scores = await findUserPreferences(req.user.id)
          filters = this.#buildDiscoverFilters(scores)
          page = await findDiscoverProgress(req.user.id)
        }
        // Retry until no more pages if restocked movies are all duplicates.
        // Allow a small buffer to avoid restocking when one movie short.
        // This makes testing easier as well.
        while (movies.length < DISCOVER_POOL - 1) {
          let tmdbMovies
          if (req.user) {
            tmdbMovies = await discoverMovies(page, filters ?? {})
            page++
          } else {
            tmdbMovies = await discoverMovies(1)
          }
          if (!tmdbMovies.results.length) break
          const validMovies = tmdbMovies.results.filter(movie => movie.poster_path)
          for (const movie of validMovies) {
            await createMovie(movie)
          }
          // Requery to check how many new movies entered the pool.
          if (req.user) {
            movies = await findUndiscoveredMovies(req.user.id)
          } else {
            movies = tmdbMovies.results
          }
        }
        if (req.user) await setDiscoverProgress(req.user.id, page)
      }
      res.status(200).json({ movies })
    } catch (error) {
      this.handleControllerError(error, 'Failed to fetch movies.', next)
    }
  }

  /**
   * Registers a user's interaction with a movie.
   * @param {object} req - Express's request object.
   * @param {object} res - Express's response object.
   * @param {(error: Error) => void} next - Express's next function to pass the error to the error-handling middleware.
   */
  async interact (req, res, next) {
    try {
      const { movieId, interaction } = req.body
      await createInteraction({ movieId, userId: req.user.id, interaction })
      // Fetch and store keywords for the recommendation profile.
      if (interaction === 'saved') {
        const keywordIds = await fetchMovieKeywords(movieId)
        await updateMovieKeywords(movieId, keywordIds)
      }
      res.status(200).json({ message: 'Interaction saved.' })
    } catch (error) {
      this.handleControllerError(error, 'Failed to register interaction.', next)
    }
  }

  /**
   * Search for a movie from TMDB.
   * @param {object} req - Express's request object.
   * @param {object} res - Express's response object.
   * @param {(error: Error) => void} next - Express's next function to pass the error to the error-handling middleware.
   */
  async search (req, res, next) {
    try {
      const { query } = req.query

      // Exit early if no search query is provided.
      if (!query?.trim()) {
        res.status(400).json({ message: 'Search query is required' })
      } else {
        const result = await searchMovies(query)
        res.status(200).json(result)
      }
    } catch (error) {
      this.handleControllerError(error, 'Movie search failed.', next)
    }
  }

  /**
   * Builds TMDB discover filters from user preference scores.
   * @param {object} scores - Weighted scores per genre and keyword.
   * @returns {object|null} Filters object, or null if no preferences exist.
   */
  #buildDiscoverFilters (scores) {
    if (!Object.keys(scores.genres).length) return null

    const filters = {}
    const topGenres = Object.entries(scores.genres)
      // Exclude drama since it's too generic to be useful.
      .filter(([id, score]) => score > 0 && id !== '18')
      .sort((a, b) => b[1] - a[1])
      .slice(0, recommendation.genreLimit)
      .map(([id]) => id)
    if (topGenres.length) filters.genres = topGenres

    const negativeKeywords = Object.entries(scores.keywords)
      .filter(([, score]) => score < 0)
      .sort((a, b) => a[1] - b[1])
      .slice(0, recommendation.negativeKeywordLimit)
      .map(([id]) => id)
    if (negativeKeywords.length) filters.without_keywords = negativeKeywords.join('|')

    // const genreMap = { 28: 'Action', 12: 'Adventure', 16: 'Animation', 35: 'Comedy', 80: 'Crime', 99: 'Documentary', 18: 'Drama', 10751: 'Family', 14: 'Fantasy', 36: 'History', 27: 'Horror', 10402: 'Music', 9648: 'Mystery', 10749: 'Romance', 878: 'Sci-Fi', 10770: 'TV Movie', 53: 'Thriller', 10752: 'War', 37: 'Western' }
    // console.log('Top genres:', topGenres.map(id => genreMap[id] || id))

    return filters
  }
}
