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
   * If the user is authenticated, fetches movies they haven't interacted with yet.
   * If the pool of undiscovered movies is low, fetches more from TMDB and stores them in the database.
   * @param {object} req - Express's request object.
   * @param {object} res - Express's response object.
   * @param {(error: Error) => void} next - Express's next function.
   * @returns {void}
   */
  async discover (req, res, next) {
    try {
      if (!req.user) {
        const { results } = await discoverMovies(1)
        return res.status(200).json({ movies: results })
      }

      let movies = await findUndiscoveredMovies(req.user.id)
      if (movies.length < DISCOVER_POOL) {
        movies = await this.#restockPool(req.user.id, movies)
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
   * @param {(error: Error) => void} next - Express's next function.
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
   * Searches for a movie via TMDB.
   * @param {object} req - Express's request object.
   * @param {object} res - Express's response object.
   * @param {(error: Error) => void} next - Express's next function.
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
   * Fetches TMDB pages and stores movies until the pool reaches DISCOVER_POOL.
   * Skips movies without a poster. Resets page progress when TMDB runs out of pages.
   * @param {number} userId - The user's ID.
   * @param {object[]} movies - The current undiscovered movie pool.
   * @returns {Promise<object[]>} The replenished pool.
   */
  async #restockPool (userId, movies) {
    const scores = await findUserPreferences(userId)
    const filters = this.#buildDiscoverFilters(scores)
    let page = await findDiscoverProgress(userId)

    while (movies.length < DISCOVER_POOL - 1) {
      const { results } = await discoverMovies(page, filters ?? {})

      if (!results.length) {
        page = 1
        break
      }

      const validMovies = results.filter(m => m.poster_path)
      for (const movie of validMovies) {
        await createMovie(movie)
      }

      movies = await findUndiscoveredMovies(userId)
      page++
    }

    await setDiscoverProgress(userId, page)
    return movies
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
      .filter(([id, score]) => score > 0 && !recommendation.excludedGenres.includes(id))
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

    return filters
  }
}
