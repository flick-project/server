/**
 * @file Controller for handling a user's favorite movies.
 * @module controllers/api/FavoriteController
 * @author Hans Nilsson
 */
import { BaseController } from './BaseController.js'
import { processMovieSignal } from '../../services/recommendationService.js'
import { create } from '../../models/movieModel.js'
import { createFavorite, findFavorites, removeFavorite } from '../../models/favoriteModel.js'

export class FavoriteController extends BaseController {
  /**
   * Gets a user's list of favorite movies.
   * @param {object} req - Express's request object.
   * @param {object} res - Express's response object.
   * @param {(error: Error) => void} next - Express's next function to pass the error to the error-handling middleware.
   */
  async getAll (req, res, next) {
    try {
      const movies = await findFavorites(req.user.id)

      res.status(200).json(movies)
    } catch (error) {
      this.handleControllerError(error, 'Failed to get favorites.', next)
    }
  }

  /**
   * Add a movie to the user's favorites.
   * @param {object} req - Express's request object.
   * @param {object} res - Express's response object.
   * @param {(error: Error) => void} next - Express's next function to pass the error to the error-handling middleware.
   */
  async create (req, res, next) {
    try {
      const movie = req.body.movie
      await create(movie)
      const success = await createFavorite(req.user.id, movie)
      if (success) {
        processMovieSignal(req.user.id, movie.id, { enrich: true, enrichPeople: true })
        res.status(201).json({ message: 'Favorite saved.' })
      } else {
        res.status(409).json({ message: 'Duplicate skipped.' })
      }
    } catch (error) {
      this.handleControllerError(error, 'Failed to save favorite.', next)
    }
  }

  /**
   * Adds a list of favorite movies during onboarding.
   * @param {object} req - Express's request object.
   * @param {object} res - Express's response object.
   * @param {(error: Error) => void} next - Express's next function to pass the error to the error-handling middleware.
   */
  async createMany (req, res, next) {
    try {
      const { movies } = req.body
      for (const movie of movies) {
        await create(movie)
        const success = await createFavorite(req.user.id, movie)
        if (success) {
          await processMovieSignal(req.user.id, movie.id, { enrich: true, enrichPeople: true, awaitEnrich: true })
        }
      }
      res.status(201).json({ message: 'Favorites saved.' })
    } catch (error) {
      this.handleControllerError(error, 'Failed to save favorites.', next)
    }
  }

  /**
   * Removes a user's favorite movie.
   * @param {object} req - Express's request object.
   * @param {object} res - Express's response object.
   * @param {(error: Error) => void} next - Express's next function to pass the error to the error-handling middleware.
   */
  async remove (req, res, next) {
    try {
      await removeFavorite(req.user.id, req.params.movieId)
      res.status(204).end()
    } catch (error) {
      this.handleControllerError(error, 'Failed to delete favorite.', next)
    }
  }
}
