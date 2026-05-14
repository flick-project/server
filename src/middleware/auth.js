/**
 * @file Authentication middleware.
 * @module middleware/auth
 * @author Hans Nilsson
 * @version 0.1.0
 */

import jwt from 'jsonwebtoken'

/**
 * Authenticates a request based on a JSON Web Token (JWT).
 *
 * This middleware checks the authorization header of the request, verifies the authentication scheme,
 * and decodes the JWT using the provided secret key.
 * If the authentication fails, an unauthorized response with a 401 Unauthorized status code is sent.
 * @param {object} req - Express request object.
 * @param {object} res - Express response object.
 * @param {(error: Error) => void} next - Express next middleware function.
 */
export const authenticateJWT = (req, res, next) => {
  try {
    const [scheme, token] = req.headers.authorization?.split(' ') ?? []

    if (scheme !== 'Bearer') {
      throw new Error('Invalid authentication scheme.')
    }

    req.user = jwt.verify(token, process.env.JWT_SECRET)

    next()
  } catch (error) {
    const err = new Error('Authentication required.')
    err.status = 401
    err.cause = error
    next(err)
  }
}
