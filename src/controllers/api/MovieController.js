/**
 * @file Movie controller for handling movie suggestions.
 * @module controllers/api/MovieController
 * @author Hans Nilsson
 * @version 0.1.0
 */

import { fetchDiscoverMovies } from '../../services/tmdbServices.js'
import { createMovie } from '../../models/movieModel.js'
import { createInteraction } from '../../models/interactionModel.js'

export class MovieController {
  async discover (req, res, next) {
    try {
      const { page } = req.query

      const movies = await fetchDiscoverMovies(page)

      // Store results in the database.
      for (const movie of movies.results) {
        await createMovie(movie)
      }

      res.status(200).json({ movies: movies.results })
    } catch (error) {
      const err = new Error(error.message || 'Failed to fetch movies.')
      err.status = error.status || 500
      err.cause = error
      next(err)
    }
  }

  async interact (req, res, next) {
    try {
      const { movieId, interaction } = req.body

      // User ID from JWT token, not body.
      await createInteraction({ movie_id: movieId, user_id: req.user.id, interaction })

      res.sendStatus(200)
    } catch (error) {
      const err = new Error(error.message || 'Failed to register interaction.')
      err.status = error.status || 500
      err.cause = error
      next(err)
    }
  }
}
