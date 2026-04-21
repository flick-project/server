/**
 * @file Auth controller for handling registration and login.
 * @module controllers/api/AuthController
 * @author Hans Nilsson
 * @version 0.1.0
 */

import { createUser } from '../../models/UserModel.js'

/**
 * Controller for authentication-related actions.
 */
export class AuthController {
  /**
   * Register a new user.
   * @param {object} req - Express request object.
   * @param {object} res - Express response object.
   * @param {(error: Error) => void} next - Express next middleware function.
   */
  async register (req, res, next) {
    try {
      const { email, password } = req.body

      await createUser(email, password)

      res.status(201).json({ message: 'Registration successful.' })
    } catch (error) {
      if (error.code === '23505') {
        error.status = 409
        error.message = 'Email is already registered.'
      }
      next(error)
    }
  }
}
