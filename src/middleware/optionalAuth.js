/**
 * @file Optional authentication middleware.
 * @module middleware/optionalAuth
 * @author Hans Nilsson
 * @version 0.1.0
 */

import jwt from 'jsonwebtoken'

/**
 * Optionally attaches user data from JWT if a valid token is present.
 * Continues without user data if no token or invalid token is provided.
 * @param {object} req - Express request object.
 * @param {object} res - Express response object.
 * @param {(error: Error) => void} next - Express next middleware function.
 */
export const optionalAuth = (req, res, next) => {
  try {
    const [scheme, token] = req.headers.authorization?.split(' ') ?? []
    if (scheme === 'Bearer') {
      req.user = jwt.verify(token, process.env.JWT_SECRET)
    }
  } catch {
    // Invalid token, continue without user.
  }
  next()
}
