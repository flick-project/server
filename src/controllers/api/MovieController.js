/**
 * @file Movie controller for handling movie suggestions.
 * @module controllers/api/MovieController
 * @author Hans Nilsson
 * @version 0.1.0
 */

import { discoverMovies, searchMovies } from '../../services/tmdbServices.js'
import { createMovie, getUndiscoveredMovies } from '../../models/movieModel.js'
import { createInteraction } from '../../models/interactionModel.js'
import { BaseController } from './BaseController.js'

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
      const minMoviePool = 20
      let movies = []

      if (req.user) {
        movies = await getUndiscoveredMovies(req.user.id)
      }

      // Restock from TMDB if pool is low.
      if (movies.length < minMoviePool) {
        const { page } = req.query
        const tmdbMovies = await discoverMovies(page ?? 1)

        // Store results in the database.
        for (const movie of tmdbMovies.results) {
          await createMovie(movie)
        }

        // Re-query after restocking.
        if (req.user) {
          movies = await getUndiscoveredMovies(req.user.id)
        } else {
          movies = tmdbMovies.results
        }
      }

      res.status(200).json({ movies })
    } catch (error) {
      this.handleControllerError(error, 'Failed to fetch movies.', next)
    }
  }

  /**
   * Search for a movie from TMDB.
   * @param {object} req - Express's request object.
   * @param {object} res - Express's response object.
   * @param {(error: Error) => void} next - Express's next function to pass the error to the error-handling middleware.
   */
  async search (req, res, next) {
    const { query } = req.query

    try {
      const result = await searchMovies(query)
      res.status(200).json(result)
    } catch (error) {
      this.handleControllerError(error, 'Movie search failed.', next)
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

      // User ID from JWT token, not body.
      await createInteraction({ movieId, userId: req.user.id, interaction })

      res.status(200).json({ message: 'Interaction saved.' })
    } catch (error) {
      this.handleControllerError(error, 'Failed to register interaction.', next)
    }
  }
}
