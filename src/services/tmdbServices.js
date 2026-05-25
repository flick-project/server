/**
 * @file API service for TMDB's database.
 * @module services/tmdbServices
 * @author Hans Nilsson
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
 * Fetch movies from TMDB's discover endpoint, optionally filtered by preferences.
 * @param {number} page - The page number to fetch.
 * @param {object} [filters] - Genre and keyword filters.
 * @returns {Promise<object>} The discover results.
 */
export const discoverMovies = async (page, filters = {}) => {
  const params = { sort_by: 'popularity.desc', page, 'vote_count.gte': 50 }
  if (filters.genres?.length) params.with_genres = filters.genres.join('|')
  if (filters.without_keywords) params.without_keywords = filters.without_keywords
  return tmdbFetch('/discover/movie', params)
}

/**
 * Fetch TMDB's recommendations for a movie.
 * @param {number} movieId - The TMDB movie ID.
 * @returns {Promise<object[]>} The filtered recommended movies.
 */
export const fetchRecommendations = async (movieId) => {
  const data = await tmdbFetch(`/movie/${movieId}/recommendations`)
  return data.results.filter(m => m.poster_path)
}

/**
 * Fetch keyword IDs for a movie.
 * @param {number} movieId - The TMDB movie ID.
 * @returns {Promise<number[]>} The keyword IDs.
 */
export const fetchMovieKeywords = async (movieId) => {
  const data = await tmdbFetch(`/movie/${movieId}/keywords`)
  return data.keywords.map(keyword => keyword.id)
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
