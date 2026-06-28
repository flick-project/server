import { discoverMovies } from '../tmdbServices.js'
import { findDiscoverProgress, setDiscoverProgress } from '../../models/userModel.js'

const toPoolItem = (movie) => ({
  id: movie.id,
  title: movie.title,
  image: movie.poster_path,
  year: movie.release_date,
  score: movie.vote_average,
  votes: movie.vote_count,
  overview: movie.overview,
  genres: movie.genre_ids ?? [],
  tags: []
})

export const tmdbSource = {
  async discover (userId, filters) {
    const page = await findDiscoverProgress(userId)
    const { results } = await discoverMovies(page, filters)
    if (!results.length) {
      await setDiscoverProgress(userId, 1)
      return []
    }
    await setDiscoverProgress(userId, page + 1)
    return results.filter(m => m.poster_path).map(toPoolItem)
  }
}
