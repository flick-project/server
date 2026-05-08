/**
 * @file Utility for creating errors with HTTP status codes.
 * @module utils/errors
 * @author Hans Nilsson
 * @version 0.1.0
 */

export const createError = (message, status) => {
  const error = new Error(message)
  error.status = status
  return error
}
