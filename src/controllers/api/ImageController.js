/**
 * @file Controller for handling images.
 * @module controllers/api/ImageController
 * @author Hans Nilsson
 */
import { BaseController } from './BaseController.js'
import { getPosterStream, getBackdropStream } from '../../services/imageService.js'

const IMAGE_ID_PATTERN = /^[a-zA-Z0-9]+\.\w+$/
const CACHE_MAX_AGE = 60 * 60 * 24 * 365 // 1 year

export class ImageController extends BaseController {
  /**
   * Serves a movie poster image.
   * @param {object} req - Express's request object.
   * @param {object} res - Express's response object.
   * @param {(error: Error) => void} next - Express's next function.
   * @returns {void}
   */
  async poster (req, res, next) {
    await this.#serveImage(req, res, next, getPosterStream, 'poster')
  }

  /**
   * Serves a movie backdrop image.
   * @param {object} req - Express's request object.
   * @param {object} res - Express's response object.
   * @param {(error: Error) => void} next - Express's next function.
   * @returns {void}
   */
  async backdrop (req, res, next) {
    await this.#serveImage(req, res, next, getBackdropStream, 'backdrop')
  }

  /**
   * Shared logic for serving an image from a service function.
   * @param {object} req - Express's request object.
   * @param {object} res - Express's response object.
   * @param {(error: Error) => void} next - Express's next function.
   * @param {void} getStream - Service function to fetch the image stream.
   * @param {string} label - Image label for error messages.
   * @returns {void}
   */
  async #serveImage (req, res, next, getStream, label) {
    const { id } = req.params
    if (!IMAGE_ID_PATTERN.test(id)) {
      return res.status(400).json({ message: `Invalid ${label} ID.` })
    }
    try {
      const imagePath = '/' + id
      const width = parseInt(req.query.w) || undefined
      const { stream, contentType } = await getStream(imagePath, width)

      res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin')
      res.setHeader('Content-Type', contentType)
      res.setHeader('Cache-Control', `public, max-age=${CACHE_MAX_AGE}, immutable`)

      stream.pipe(res)
    } catch (error) {
      this.handleControllerError(error, `Failed to serve ${label}.`, next)
    }
  }
}
