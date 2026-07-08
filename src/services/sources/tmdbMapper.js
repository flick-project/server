/**
 * @file Maps between TMDB movies and the generic PoolItem format.
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

/**
 * Maps a generic PoolItem back to the TMDB movie format.
 * @param {object} item - The PoolItem.
 * @returns {object} The TMDB movie shape.
 */
export const fromPoolItem = (item) => ({
  id: item.id,
  title: item.title,
  poster_path: item.image,
  release_date: item.year,
  vote_average: item.score,
  vote_count: item.votes,
  overview: item.overview,
  genre_ids: item.genres
})
