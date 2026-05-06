/**
 * @file Auth controller for handling registration and login.
 * @module controllers/api/AuthController
 * @author Hans Nilsson
 * @version 0.1.0
 */

import { createUser, authenticate } from '../../models/userModel.js'
import jwt from 'jsonwebtoken'
import { BaseController } from './BaseController.js'

export class AuthController extends BaseController {
  /**
   * Register a new user.
   * @param {object} req - Express request object.
   * @param {object} res - Express response object.
   * @param {(error: Error) => void} next - Express next middleware function.
   */
  async register (req, res, next) {
    try {
      const { email, displayName, password } = req.body

      await createUser(email, displayName, password)

      res.status(201).json({ message: 'Registration successful.' })
    } catch (error) {
      if (error.code === '23505') {
        error.status = 409
        error.message = 'Email is already registered.'
      }
      this.handleControllerError(error, 'Registration failed.', next)
    }
  }

  async login (req, res, next) {
    try {
      const { email, password } = req.body

      const user = await authenticate(email, password)

      const token = jwt.sign({ id: user.id, email: user.email, display_name: user.display_name },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_LIFE }
      )

      res.status(200).json({ token })
    } catch (error) {
      this.handleControllerError(error, 'Wrong email or password.', next)
    }
  }
}
