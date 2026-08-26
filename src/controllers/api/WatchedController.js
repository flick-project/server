/**
 * @file Controller for handling watched movies.
 * @module controllers/api/WatchedController
 * @author Hans Nilsson
 */
import { BaseController } from './BaseController.js'
import { markWatched, unmarkWatched, unmarkWatchedMany, findWatched } from '../../models/watchedModel.js'
import { ensureExists } from '../../models/movieModel.js'

export class WatchedController extends BaseController {
  /**
   * Fetches the user's watched movies.
   * @param {object} req - Express's request object.
   * @param {object} res - Express's response object.
   * @param {(error: Error) => void} next - Express's next function.
   */
  async getAll (req, res, next) {
    try {
      const movies = await findWatched(req.user.id)
      res.status(200).json({ movies })
    } catch (error) {
      this.handleControllerError(error, 'Failed to fetch watched movies.', next)
    }
  }

  /**
   * Marks a single movie as watched.
   * @param {object} req - Express's request object.
   * @param {object} res - Express's response object.
   * @param {(error: Error) => void} next - Express's next function.
   */
  async create (req, res, next) {
    try {
      const { movieId } = req.body
      await ensureExists(movieId)
      await markWatched(req.user.id, movieId)
      res.status(200).json({ message: 'Movie marked as watched.' })
    } catch (error) {
      this.handleControllerError(error, 'Failed to mark movie as watched.', next)
    }
  }

  /**
   * Marks multiple movies as watched.
   * @param {object} req - Express's request object.
   * @param {object} res - Express's response object.
   * @param {(error: Error) => void} next - Express's next function.
   */
  async createMany (req, res, next) {
    try {
      const { movieIds } = req.body
      for (const movieId of movieIds) {
        await ensureExists(movieId)
        await markWatched(req.user.id, movieId)
      }
      res.status(200).json({ message: 'Movies marked as watched.' })
    } catch (error) {
      this.handleControllerError(error, 'Failed to mark movies as watched.', next)
    }
  }

  /**
   * Removes a movie's watched mark.
   * @param {object} req - Express's request object.
   * @param {object} res - Express's response object.
   * @param {(error: Error) => void} next - Express's next function.
   */
  async remove (req, res, next) {
    try {
      await unmarkWatched(req.user.id, req.params.movieId)
      res.status(204).end()
    } catch (error) {
      this.handleControllerError(error, 'Failed to remove watched mark.', next)
    }
  }

  /**
   * Removes the watched mark for multiple movies.
   * @param {object} req - Express's request object.
   * @param {object} res - Express's response object.
   * @param {(error: Error) => void} next - Express's next function.
   */
  async removeMany (req, res, next) {
    try {
      const { movieIds } = req.body
      await unmarkWatchedMany(req.user.id, movieIds)
      res.status(204).end()
    } catch (error) {
      this.handleControllerError(error, 'Failed to remove watched marks.', next)
    }
  }
}
