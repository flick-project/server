/**
 * @file User controller for handling users.
 * @module controllers/api/UserController
 * @author Hans Nilsson
 * @version 0.1.0
 */

import { saveFavorite, getFavorites } from '../../models/favoriteModel.js'
import { BaseController } from './BaseController.js'

export class UserController extends BaseController {
  /**
   * Save a list of favorite movies with the user.
   * @param {object} req - Express's request object.
   * @param {object} res - Express's response object.
   * @param {(error: Error) => void} next - Express's next function to pass the error to the error-handling middleware.
   */
  async saveFavorites (req, res, next) {
    const { movies } = req.body

    try {
      for (const movie of movies) {
        await saveFavorite(req.user.id, movie)
      }
      res.status(201).json({ message: 'Favorites saved.' })
    } catch (error) {
      this.handleControllerError(error, 'Failed to save favorites.', next)
    }
  }

  /**
   * Gets a user's list of favorite movies.
   * @param {object} req - Express's request object.
   * @param {object} res - Express's response object.
   * @param {(error: Error) => void} next - Express's next function to pass the error to the error-handling middleware.
   */
  async getFavorites (req, res, next) {
    try {
      const movies = await getFavorites(req.user.id)

      res.status(200).json(movies)
    } catch (error) {
      this.handleControllerError(error, 'Failed to get favorites.', next)
    }
  }
}
