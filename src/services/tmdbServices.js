/**
 * @file API service for TMDB's database.
 * @module services/tmdbServices
 * @author Hans Nilsson
 * @version 0.1.0
 */

/**
 * Fetch from the TMDB API with the given path and query parameters.
 * @param {string} path - The API endpoint path.
 * @param {object} [params] - Parameters to include in the request.
 * @returns {Promise<object>} The parsed JSON response.
 */
const tmdbFetch = async (path, params = {}) => {
  const url = new URL(`https://api.themoviedb.org/3${path}`)
  url.searchParams.set('api_key', process.env.TMDB_API_KEY)
  url.searchParams.set('include_adult', 'false')
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value)
  }
  const res = await fetch(url)
  if (!res.ok) {
    const error = new Error(res.statusText || 'Failed to fetch from TMDB.')
    error.status = res.status
    throw error
  }
  return res.json()
}

/**
 * Fetch a page of popular movies from TMDB's discover endpoint.
 * @param {number} page - The page number to fetch.
 * @returns {Promise<object>} The discover results.
 */
export const discoverMovies = async (page) => {
  return tmdbFetch('/discover/movie', { sort_by: 'popularity.desc', page })
}

/**
 * Search for movies by title.
 * @param {string} query - The search query.
 * @returns {Promise<object>} The search results, or empty results if query is blank.
 */
export const searchMovies = async (query) => {
  if (!query?.trim()) return { results: [] }
  return tmdbFetch('/search/movie', { query })
}
