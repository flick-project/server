/**
 * @file Controller for handling movie interactions.
 * @module controllers/api/InteractionController
 * @author Hans Nilsson
 */
import { BaseController } from './BaseController.js'
import { createInteraction } from '../../models/interactionModel.js'
import { ensureExists, storeKeywords } from '../../models/movieModel.js'
import { fetchMovieKeywords } from '../../services/tmdbServices.js'

export class InteractionController extends BaseController {
  /**
   * Registers a user's interaction with a movie.
   * @param {object} req - Express's request object.
   * @param {object} res - Express's response object.
   * @param {(error: Error) => void} next - Express's next function.
   */
  async create (req, res, next) {
    try {
      const { movieId, interaction } = req.body
      await ensureExists(movieId)
      await createInteraction({ movieId, userId: req.user.id, interaction })
      // Fetch and store keywords for the recommendation profile.
      if (interaction === 'saved' || interaction === 'dismissed') {
        const keywords = await fetchMovieKeywords(movieId)
        await storeKeywords(movieId, keywords)
      }
      res.status(200).json({ message: 'Interaction saved.' })
    } catch (error) {
      this.handleControllerError(error, 'Failed to register interaction.', next)
    }
  }
}
