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
import { recommendation } from '../../config/recommendation.js'

const titleCase = (str) => str.split(' ').map(w => w ? w[0].toUpperCase() + w.slice(1) : '').join(' ')

const topScores = (scores, limit, positive = true) =>
  Object.entries(scores)
    .filter(([, score]) => positive ? score > 0 : score < 0)
    .sort(([, a], [, b]) => positive ? b - a : a - b)
    .slice(0, limit)
    .map(([key, score]) => ({ key, score }))

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
      const keywordNames = await findKeywordNames(Object.keys(preferences.scores.keywords).map(Number))

      const resolvedKeywords = {}
      for (const [id, score] of Object.entries(preferences.scores.keywords)) {
        const count = preferences.keywordCounts[id] || 1
        if (count < recommendation.keywordDisplayMinMovies) continue
        resolvedKeywords[titleCase(keywordNames[id] || String(id))] = score / count
      }

      const stats = {
        totalInteractions: statsData.total_interactions,
        totalSaves: statsData.total_saves,
        totalSkips: statsData.total_skips,
        totalWatched: statsData.total_watched,
        preferences: {
          topGenres: topScores(preferences.scores.genres, 3),
          topKeywords: topScores(resolvedKeywords, 7),
          worstKeywords: topScores(resolvedKeywords, 10, false)
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
