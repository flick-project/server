/**
 * @file Controller for handling user ratings.
 * @module controllers/api/RatingController
 * @author Hans Nilsson
 */

import { createRating, removeRating } from '../../models/ratingModel.js'
import { BaseController } from './BaseController.js'

export class RatingController extends BaseController {
  /**
   * Rates a movie.
   * @param {object} req - Express's request object.
   * @param {object} res - Express's response object.
   * @param {(error: Error) => void} next - Express's next function to pass the error to the error-handling middleware.
   */
  async rate (req, res, next) {
    try {
      const { movieId, rating } = req.body

      // User ID from JWT token, not body.
      const result = await createRating(req.user.id, movieId, rating)

      res.status(200).json(result)
    } catch (error) {
      this.handleControllerError(error, 'Failed to register rating.', next)
    }
  }

  /**
   * Deletes a movie rating.
   * @param {object} req - Express's request object.
   * @param {object} res - Express's response object.
   * @param {(error: Error) => void} next - Express's next function to pass the error to the error-handling middleware.
   */
  async delete (req, res, next) {
    try {
      await removeRating(req.user.id, req.params.movieId)
      res.status(204).end()
    } catch (error) {
      this.handleControllerError(error, 'Failed to delete rating.', next)
    }
  }
}
