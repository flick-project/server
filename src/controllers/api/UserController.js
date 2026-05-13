/**
 * @file User controller for handling users.
 * @module controllers/api/UserController
 * @author Hans Nilsson
 */

import { BaseController } from './BaseController.js'
import { createFavorite, findFavorites } from '../../models/favoriteModel.js'
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
   * Gets a user's stats (swipes and saves).
   * @param {object} req - Express's request object.
   * @param {object} res - Express's response object.
   * @param {(error: Error) => void} next - Express's next function to pass the error to the error-handling middleware.
   */
  async getStats (req, res, next) {
    try {
      const statsData = await findStats(req.user.id)

      const stats = {
        totalSwipes: statsData.total_swipes,
        totalSaves: statsData.total_saves
      }

      res.status(200).json(stats)
    } catch (error) {
      this.handleControllerError(error, 'Failed to fetch stats.', next)
    }
  }
}
