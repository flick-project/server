/**
 * @file Utility for creating errors with HTTP status codes.
 * @module utils/errors
 * @author Hans Nilsson
 */

export const createError = (message, status) => {
  const error = new Error(message)
  error.status = status
  return error
}
