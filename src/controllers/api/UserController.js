/**
 * @file User controller for handling users.
 * @module controllers/api/UserController
 * @author Hans Nilsson
 */
import { BaseController } from './BaseController.js'
import { findProfileInfo, findStats, findKeywordNames } from '../../models/profileModel.js'
import { gravatarUrl } from '../../utils/gravatar.js'
import { deleteUser } from '../../models/userModel.js'
import { findUserPreferences } from '../../models/recommendationModel.js'

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
      const [statsData, preferences] = await Promise.all([
        findStats(req.user.id),
        findUserPreferences(req.user.id)
      ])
      const keywordNames = await findKeywordNames(Object.keys(preferences.keywords).map(Number))

      const keywordScores = {}
      for (const [id, score] of Object.entries(preferences.keywords)) {
        const name = keywordNames[id] || id
        keywordScores[name] = score
      }

      const stats = {
        totalInteractions: statsData.total_interactions,
        totalSaves: statsData.total_saves,
        totalSkips: statsData.total_skips,
        totalWatched: statsData.total_watched,
        preferences: {
          genres: preferences.genres,
          keywords: keywordScores
        }
      }
      res.status(200).json(stats)
    } catch (error) {
      this.handleControllerError(error, 'Failed to fetch stats.', next)
    }
  }

  /**
   * Deletes a user's account.
   * @param {object} req - Express's request object.
   * @param {object} res - Express's response object.
   * @param {(error: Error) => void} next - Express's next function to pass the error to the error-handling middleware.
   * @returns {void}
   */
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
