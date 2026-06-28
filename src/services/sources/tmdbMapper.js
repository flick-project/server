/**
 * @file Maps TMDB movie objects to the generic PoolItem format.
 * @module services/sources/tmdbMapper
 * @author Hans Nilsson
 */

/**
 * Maps a TMDB movie object to the generic PoolItem format.
 * @param {object} movie - The TMDB movie.
 * @returns {object} The mapped PoolItem.
 */
export const toPoolItem = (movie) => ({
  id: movie.id,
  title: movie.title,
  image: movie.poster_path,
  year: movie.release_date,
  score: movie.vote_average,
  votes: movie.vote_count,
  overview: movie.overview,
  genres: movie.genre_ids ?? [],
  tags: movie.tags ?? []
})
