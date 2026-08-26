/**
 * @file Controller for handling user ratings.
 * @module controllers/api/RatingController
 * @author Hans Nilsson
 */
import { BaseController } from './BaseController.js'
import { createRating, removeRating } from '../../models/ratingModel.js'
import { processMovieSignal } from '../../services/recommendationService.js'
import { ensureExists } from '../../models/movieModel.js'
import { markWatched } from '../../models/watchedModel.js'

export class RatingController extends BaseController {
  /**
   * Rates a movie. Also marks it as watched, since rating implies having seen it.
   * @param {object} req - Express's request object.
   * @param {object} res - Express's response object.
   * @param {(error: Error) => void} next - Express's next function.
   */
  async rate (req, res, next) {
    try {
      const { movieId, rating } = req.body
      await ensureExists(movieId)
      const result = await createRating(req.user.id, movieId, rating)
      await markWatched(req.user.id, movieId)
      processMovieSignal(req.user.id, movieId, {
        enrich: rating === 'love' || rating === 'like',
        enrichPeople: rating === 'love'
      })
      res.status(200).json(result)
    } catch (error) {
      this.handleControllerError(error, 'Failed to register rating.', next)
    }
  }

  /**
   * Removes a movie rating. Does not remove the watched mark — a user
   * can retract their opinion without claiming they haven't seen it.
   * Unwatching handles its own rating removal if needed.
   * @param {object} req - Express's request object.
   * @param {object} res - Express's response object.
   * @param {(error: Error) => void} next - Express's next function.
   */
  async remove (req, res, next) {
    try {
      await removeRating(req.user.id, req.params.movieId)
      res.status(204).end()
    } catch (error) {
      this.handleControllerError(error, 'Failed to delete rating.', next)
    }
  }
}
