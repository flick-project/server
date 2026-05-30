/**
 * @file Controller for handling images.
 * @module controllers/api/ImageController
 * @author Hans Nilsson
 */

import { BaseController } from './BaseController.js'
import { getPosterStream } from '../../services/imageService.js'

const POSTER_ID_PATTERN = /^[a-zA-Z0-9]+\.\w+$/

export class ImageController extends BaseController {
  /**
   * Serves a movie poster image.
   * If the poster+width combination is cached as WebP, stream it directly.
   * On first request, fetches the original from TMDB, streams it as JPEG,
   * then asynchronously converts and caches a WebP version for future requests.
   * @param {object} req - Express's request object.
   * @param {object} res - Express's response object.
   * @param {(error: Error) => void} next - Express's next function to pass the error to the error-handling middleware.
   * @returns {void}
   */
  async poster (req, res, next) {
    const { id } = req.params
    if (!POSTER_ID_PATTERN.test(id)) {
      return res.status(400).json({ message: 'Invalid poster ID.' })
    }
    try {
      const posterPath = '/' + req.params.id
      const width = parseInt(req.query.w) || 300
      const { stream, contentType } = await getPosterStream(posterPath, width)

      res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin')
      res.setHeader('Content-Type', contentType)

      const maxAge = 60 * 60 * 24 * 30 // 30 days
      res.setHeader('Cache-Control', `public, max-age=${maxAge}, immutable`)

      stream.pipe(res)
    } catch (error) {
      this.handleControllerError(error, 'Failed to serve poster.', next)
    }
  }
}
