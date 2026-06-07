/**
 * @file User controller for handling users.
 * @module controllers/api/UserController
 * @author Hans Nilsson
 */
import { BaseController } from './BaseController.js'
import { findProfileInfo, findStats } from '../../models/profileModel.js'
import { gravatarUrl } from '../../utils/gravatar.js'
import { deleteUser } from '../../models/userModel.js'

export class UserController extends BaseController {
  /**
   * Gets a user's basic profile info.
   * @param {object} req - Express's request object.
   * @param {object} res - Express's response object.
   * @param {(error: Error) => void} next - Express's next function to pass the error to the error-handling middleware.
   */
  async profile (req, res, next) {
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
  async stats (req, res, next) {
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

  async remove (req, res, next) {
    try {
      const deleted = await deleteUser(req.user.id)
      if (!deleted) {
        return res.status(404).json({ message: 'Account not found.' })
      }
      res.status(204).end()
    } catch (error) {
      this.handleControllerError(error, 'Failed to delete account.', next)
    }
  }
}
