/**
 * @file Controller for handling user ratings.
 * @module controllers/api/RatingController
 * @author Hans Nilsson
 */

import { BaseController } from './BaseController.js'
import { createRating, removeRating } from '../../models/ratingModel.js'
import { enrichPool } from '../../services/recommendationService.js'
import { fetchMovieKeywords } from '../../services/tmdbServices.js'
import { updateMovieKeywords } from '../../models/movieModel.js'

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
      const result = await createRating(req.user.id, movieId, rating)
      // Fetch and store keywords for the recommendation profile.
      const keywordIds = await fetchMovieKeywords(movieId)
      await updateMovieKeywords(movieId, keywordIds)
      // Store genre-filtered TMDB recommendations for loved movies.
      if (rating === 'love') {
        enrichPool(req.user.id, movieId).catch(console.error)
      }
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
