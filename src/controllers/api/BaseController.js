/**
 * @file Base controller with shared utilities for all controllers.
 * @module controllers/api/BaseController
 * @author Hans Nilsson
 * @version 0.1.0
 */

export class BaseController {
  /**
   * Centralized error handling for controller methods.
   * @param {Error} error - The original error thrown.
   * @param {string} fallbackMessage - A generic message to use if the error doesn't have one.
   * @param {(error: Error) => void} next - Express's next function to pass the error to the error-handling middleware.
   */
  handleControllerError (error, fallbackMessage, next) {
    const err = new Error(error.message || fallbackMessage)
    err.status = error.status || 500
    err.cause = error
    next(err)
  }
}
