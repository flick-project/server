/**
 * @file Utility for input validation.
 * @module utils/validation
 * @author Hans Nilsson
 */

export const validateTmdbId = (tmdbId) => {
  const id = Number(tmdbId)
  if (!id) {
    const error = new Error('Invalid TMDB ID format')
    error.status = 400
    throw error
  }
  return id
}
