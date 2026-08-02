/**
 * @file Movie controller for handling movie suggestions.
 * @module controllers/api/MovieController
 * @author Hans Nilsson
 */
import { BaseController } from './BaseController.js'
import { findUserPreferences } from '../../models/recommendationModel.js'
import { findMovie, findMovieWithDetails, searchMovies } from '../../services/tmdbServices.js'
import { recommendation } from '../../config/recommendation.js'
import { tmdbSource } from '../../services/sources/tmdbSource.js'
import { servePool, addToPool, countUndiscovered } from '../../services/pool/pool.js'
import { fromPoolItem } from '../../services/sources/tmdbMapper.js'
import { enrichPendingRatings } from '../../services/recommendationService.js'
import { isSaved } from '../../models/watchlistModel.js'
import { findUserRating } from '../../models/ratingModel.js'

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

      const { scores } = await findUserPreferences(req.user.id)

      // Enrich from pending ratings first.
      await enrichPendingRatings(req.user.id)

      // Only fill remaining slots with discover.
      const undiscoveredCount = await countUndiscovered(req.user.id)
      if (undiscoveredCount < DISCOVER_POOL) {
        const filters = this.#buildDiscoverFilters(scores)
        const items = await tmdbSource.discover(req.user.id, filters)
        await addToPool(req.user.id, items, 'discover', scores)
      }

      const movies = await servePool(req.user.id, 20, scores)
      res.status(200).json({ movies })
    } catch (error) {
      this.handleControllerError(error, 'Failed to fetch movies.', next)
    }
  }

  /**
   * Restocks the user's pool without serving movies.
   * Used after import to fill the pool based on updated taste profile.
   * @param {object} req - Express's request object.
   * @param {object} res - Express's response object.
   * @param {(error: Error) => void} next - Express's next function.
   */
  async restock (req, res, next) {
    try {
      const { scores } = await findUserPreferences(req.user.id)
      const undiscoveredCount = await countUndiscovered(req.user.id)
      if (undiscoveredCount < DISCOVER_POOL) {
        const filters = this.#buildDiscoverFilters(scores)
        const items = await tmdbSource.discover(req.user.id, filters)
        await addToPool(req.user.id, items, 'discover', scores)
      }
      res.status(204).end()
      enrichPendingRatings(req.user.id).catch(console.error)
    } catch (error) {
      this.handleControllerError(error, 'Failed to restock pool.', next)
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
   * Fetches a single movie, including credits and videos by TMDB ID,
   * as well as the user's interactions and ratings on said movie.
   * @param {object} req - Express's request object.
   * @param {object} res - Express's response object.
   * @param {(error: Error) => void} next - Express's next function.
   */
  async findWithDetails (req, res, next) {
    try {
      const { tmdbId } = req.params
      const movie = await findMovieWithDetails(tmdbId)

      if (req.user) {
        const [saved, rating] = await Promise.all([
          isSaved(req.user.id, tmdbId),
          findUserRating(req.user.id, tmdbId)
        ])
        movie.saved = saved
        movie.user_rating = rating
      }

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
      .filter(([id, score]) => score > 0 && !recommendation.genreBlocklist.includes(Number(id)))
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
