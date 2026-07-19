/**
 * @file Movie controller for handling movie suggestions.
 * @module controllers/api/MovieController
 * @author Hans Nilsson
 */
import { BaseController } from './BaseController.js'
import { findUserPreferences } from '../../models/recommendationModel.js'
import { findMovie, searchMovies } from '../../services/tmdbServices.js'
import { recommendation } from '../../config/recommendation.js'
import { tmdbSource } from '../../services/sources/tmdbSource.js'
import { servePool, addToPool, countUndiscovered } from '../../services/pool/pool.js'
import { fromPoolItem } from '../../services/sources/tmdbMapper.js'

const DISCOVER_POOL = 20

export class MovieController extends BaseController {
  /**
   * Fetches a list of movies for discovery.
   * Guests get a single movie from TMDB. Logged-in users get a personalized
   * pool, restocked from their preferred genres when low.
   * @param {object} req - Express's request object.
   * @param {object} res - Express's response object.
   * @param {(error: Error) => void} next - Express's next function.
   * @returns {void}
   */
  async discover (req, res, next) {
    try {
      if (!req.user) {
        const items = await tmdbSource.discover(null, {})
        return res.status(200).json({ movies: items.slice(0, 1).map(fromPoolItem) })
      }

      const undiscoveredCount = await countUndiscovered(req.user.id)
      if (undiscoveredCount < DISCOVER_POOL) {
        const { scores } = await findUserPreferences(req.user.id)
        const filters = this.#buildDiscoverFilters(scores)
        const items = await tmdbSource.discover(req.user.id, filters)
        await addToPool(req.user.id, items, 'discover', scores)
      }

      const movies = await servePool(req.user.id)
      res.status(200).json({ movies })
    } catch (error) {
      this.handleControllerError(error, 'Failed to fetch movies.', next)
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
   * Fetches a single movie by TMDB ID.
   * @param {object} req - Express's request object.
   * @param {object} res - Express's response object.
   * @param {(error: Error) => void} next - Express's next function.
   */
  async find (req, res, next) {
    try {
      const { tmdbId } = req.params
      const movie = await findMovie(tmdbId)
      res.status(200).json(movie)
    } catch (error) {
      this.handleControllerError(error, 'Failed to fetch movie.', next)
    }
  }

  /**
   * Builds TMDB discover filters from user preference scores.
   * @param {object} scores - Weighted scores per genre and keyword.
   * @returns {object} Filters object.
   */
  #buildDiscoverFilters (scores) {
    const filters = {}

    const topGenres = Object.entries(scores.genres ?? {})
      .filter(([id, score]) => score > 0 && !recommendation.excludedGenres.includes(id))
      .sort((a, b) => b[1] - a[1])
      .slice(0, recommendation.genreLimit)
      .map(([id]) => id)
    if (topGenres.length) filters.genres = topGenres

    const negativeKeywords = Object.entries(scores.keywords ?? {})
      .filter(([, score]) => score < 0)
      .sort((a, b) => a[1] - b[1])
      .slice(0, recommendation.keywordLimit)
      .map(([id]) => id)
    if (negativeKeywords.length) filters.without_keywords = negativeKeywords.join('|')

    return filters
  }
}
