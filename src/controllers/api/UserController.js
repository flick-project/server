/**
 * @file User controller for handling users.
 * @module controllers/api/UserController
 * @author Hans Nilsson
 */

import { BaseController } from './BaseController.js'
import { createFavorite, findFavorites, removeFavorite } from '../../models/favoriteModel.js'
import { findProfileInfo, findStats } from '../../models/profileModel.js'
import { gravatarUrl } from '../../utils/gravatar.js'

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
        await createFavorite(req.user.id, movie)
      }
      res.status(201).json({ message: 'Favorites saved.' })
    } catch (error) {
      this.handleControllerError(error, 'Failed to save favorites.', next)
    }
  }

  /**
   * Add a movie to the user's favorites.
   * @param {object} req - Express's request object.
   * @param {object} res - Express's response object.
   * @param {(error: Error) => void} next - Express's next function to pass the error to the error-handling middleware.
   */
  async addFavorite (req, res, next) {
    try {
      const success = await createFavorite(req.user.id, req.body.movie)
      success
        ? res.status(201).json({ message: 'Favorite saved.' })
        : res.status(409).json({ message: 'Duplicate skipped.' })
    } catch (error) {
      this.handleControllerError(error, 'Failed to save favorite.', next)
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
      const movies = await findFavorites(req.user.id)

      res.status(200).json(movies)
    } catch (error) {
      this.handleControllerError(error, 'Failed to get favorites.', next)
    }
  }

  /**
   * Deletes a user's favorite movie.
   * @param {object} req - Express's request object.
   * @param {object} res - Express's response object.
   * @param {(error: Error) => void} next - Express's next function to pass the error to the error-handling middleware.
   */
  async deleteFavorite (req, res, next) {
    try {
      await removeFavorite(req.user.id, req.params.movieId)
      res.status(204).end()
    } catch (error) {
      this.handleControllerError(error, 'Failed to delete favorite.', next)
    }
  }

  /**
   * Gets a user's basic profile info.
   * @param {object} req - Express's request object.
   * @param {object} res - Express's response object.
   * @param {(error: Error) => void} next - Express's next function to pass the error to the error-handling middleware.
   */
  async getProfile (req, res, next) {
    try {
      const profileData = await findProfileInfo(req.user.id)

      const profile = {
        displayName: profileData.display_name,
        gravatar: gravatarUrl(profileData.email),
        createdAt: profileData.created_at
      }

      res.status(200).json(profile)
    } catch (error) {
      this.handleControllerError(error, 'Failed to fetch profile.', next)
    }
  }

  /**
   * Gets interaction stats for a user.
   * @param {object} req - Express's request object.
   * @param {object} res - Express's response object.
   * @param {(error: Error) => void} next - Express's next function to pass the error to the error-handling middleware.
   */
  async getStats (req, res, next) {
    try {
      const statsData = await findStats(req.user.id)

      const stats = {
        totalInteractions: statsData.total_interactions,
        totalSaves: statsData.total_saves,
        totalSkips: statsData.total_skips,
        totalWatched: statsData.total_watched
      }

      res.status(200).json(stats)
    } catch (error) {
      this.handleControllerError(error, 'Failed to fetch stats.', next)
    }
  }
}
