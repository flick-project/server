/**
 * @file Watchlist controller for handling a user's watchlist.
 * @module controllers/api/WatchlistController
 * @author Hans Nilsson
 * @version 0.1.0
 */

import { getSavedMovies } from '../../models/movieModel.js'
import { deleteInteraction } from '../../models/interactionModel.js'
import { BaseController } from './BaseController.js'

export class WatchlistController extends BaseController {
  /**
   * Gets the user's saved movies.
   * @param {object} req - Express's request object.
   * @param {object} res - Express's response object.
   * @param {(error: Error) => void} next - Express's next function to pass the error to the error-handling middleware.
   */
  async getWatchlist (req, res, next) {
    try {
      const movies = await getSavedMovies(req.user.id, req.query.page)

      res.status(200).json({ movies })
    } catch (error) {
      this.handleControllerError(error, 'Failed to fetch watchlist.', next)
    }
  }

  /**
   * Remove a movie from the user's watchlist.
   * @param {object} req - Express's request object.
   * @param {object} res - Express's response object.
   * @param {(error: Error) => void} next - Express's next function to pass the error to the error-handling middleware.
   * @returns {void}
   */
  async deleteFromWatchlist (req, res, next) {
    try {
      const result = await deleteInteraction({ movieId: req.params.movieId, userId: req.user.id })

      if (!result) {
        return res.status(404).json({ message: 'Movie not in watchlist.' })
      }

      res.status(200).json({ message: 'Movie removed from watchlist' })
    } catch (error) {
      this.handleControllerError(error, 'Failed to delete movie from watchlist.', next)
    }
  }
}
