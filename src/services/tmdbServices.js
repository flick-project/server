/**
 * @file API service for TMDB's database.
 * @module services/tmdbServices
 * @author Hans Nilsson
 */

export const fetchDiscoverMovies = async (page) => {
  const url = new URL('https://api.themoviedb.org/3/discover/movie')
  url.searchParams.set('api_key', process.env.TMDB_API_KEY)
  url.searchParams.set('sort_by', 'popularity.desc')
  url.searchParams.set('page', page)

  const res = await fetch(url)

  if (!res.ok) {
    const error = new Error(res.statusText || 'Failed to fetch movies.')
    error.status = res.status
    throw error
  }

  const data = await res.json()

  return data
}
