/**
 * @file Auth controller for handling registration, login, logout and refresh tokens.
 * @module controllers/api/AuthController
 * @author Hans Nilsson
 * @version 0.1.0
 */

import jwt from 'jsonwebtoken'
import { BaseController } from './BaseController.js'
import { createError } from '../../utils/errors.js'
import { createUser, authenticate, findById } from '../../models/userModel.js'
import { createToken, findValid, deleteToken, EXPIRY_DAYS } from '../../models/refreshTokenModel.js'

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict'
}

export class AuthController extends BaseController {
  /**
   * Create a new user account and return access and refresh tokens.
   * @param {object} req - Express request object.
   * @param {object} res - Express response object.
   * @param {(error: Error) => void} next - Express next middleware function.
   */
  async register (req, res, next) {
    try {
      const { email, displayName, password } = req.body
      const user = await createUser(email, displayName, password)

      await this.#sendAuthResponse(res, user, 201)
    } catch (error) {
      if (error.code === '23505') {
        error.status = 409
        error.message = 'Email is already registered.'
      }
      this.handleControllerError(error, 'Registration failed.', next)
    }
  }

  /**
   * Authenticate with email and password, returning access and refresh tokens.
   * @param {object} req - Express request object.
   * @param {object} res - Express response object.
   * @param {(error: Error) => void} next - Express next middleware function.
   */
  async login (req, res, next) {
    try {
      const { email, password } = req.body
      const user = await authenticate(email, password)

      await this.#sendAuthResponse(res, user, 200)
    } catch (error) {
      this.handleControllerError(error, 'Wrong email or password.', next)
    }
  }

  /**
   * Refreshes the access token using a refresh token.
   * Also generates a new refresh token, preventing replay attacks.
   * @param {object} req - Express request object.
   * @param {object} res - Express response object.
   * @param {(error: Error) => void} next - Express next middleware function.
   * @returns {void}
   */
  async refresh (req, res, next) {
    try {
      const refreshToken = req.cookies?.refreshToken
      if (!refreshToken) return res.status(401).json({ message: 'No refresh token provided.' })

      // Ensure the refresh token exists in the database.
      const tokenRow = await findValid(refreshToken)
      if (!tokenRow) throw createError('Invalid refresh token', 401)

      await deleteToken(refreshToken)

      const user = await findById(tokenRow.user_id)

      await this.#sendAuthResponse(res, user, 201)
    } catch (error) {
      this.handleControllerError(error, 'Invalid or expired session.', next)
    }
  }

  /**
   * Log out by revoking the refresh token and clearing the cookie.
   * @param {object} req - Express request object.
   * @param {object} res - Express response object.
   * @param {(error: Error) => void} next - Express next middleware function.
   */
  async logout (req, res, next) {
    try {
      const refreshToken = req.cookies?.refreshToken
      if (refreshToken) await deleteToken(refreshToken)

      res
        .clearCookie('refreshToken', COOKIE_OPTIONS)
        .sendStatus(204)
    } catch (error) {
      this.handleControllerError(error, 'Logout failed.', next)
    }
  }

  /**
   * Sign an access token, create a refresh token, and send both in the response.
   * @param {object} res - Express response object.
   * @param {object} user - The user row with id, email, and display_name.
   * @param {number} status - HTTP status code for the response.
   */
  async #sendAuthResponse (res, user, status) {
    const accessToken = jwt.sign({ id: user.id, email: user.email, display_name: user.display_name },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_LIFE }
    )
    const refreshToken = await createToken(user.id)

    res
      .status(status)
      .cookie('refreshToken', refreshToken, {
        ...COOKIE_OPTIONS,
        maxAge: process.env.NODE_ENV === 'production'
          ? EXPIRY_DAYS * 24 * 60 * 60 * 1000
          // 20 minutes in dev.
          : 20 * 60 * 1000
      })
      .json({
        access_token: accessToken
      })
  }
}
