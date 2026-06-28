import { create, findUndiscovered } from '../../models/movieModel.js'

export const addToPool = async (userId, items) => {
  for (const item of items) {
    await create(itemToMovie(item))
  }
}

export const servePool = async (userId, count = 20) => {
  return findUndiscovered(userId, count)
}

const itemToMovie = (item) => ({
  id: item.id,
  title: item.title,
  poster_path: item.image,
  release_date: item.year,
  vote_average: item.score,
  vote_count: item.votes,
  overview: item.overview,
  genre_ids: item.genres
})
