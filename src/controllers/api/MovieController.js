/**
 * @file Movie controller for handling movie suggestions.
 * @module controllers/api/MovieController
 * @author Hans Nilsson
 * @version 0.1.0
 */

import { fetchDiscoverMovies } from '../../services/tmdbServices.js'
import { createMovie, getUndiscoveredMovies } from '../../models/movieModel.js'
import { createInteraction } from '../../models/interactionModel.js'

export class MovieController {
  async discover (req, res, next) {
    try {
      let movies = []

      if (req.user) {
        movies = await getUndiscoveredMovies(req.user.id)
      }

      // Restock from TMDB if pool is low.
      if (movies.length < 20) {
        const { page } = req.query
        const tmdbMovies = await fetchDiscoverMovies(page)

        // Store results in the database.
        for (const movie of tmdbMovies.results) {
          await createMovie(movie)
        }

        // Re-query after restocking.
        if (req.user) {
          movies = await getUndiscoveredMovies(req.user.id)
        } else {
          movies = tmdbMovies.results
        }
      }

      res.status(200).json({ movies })
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

      res.status(200).json({ message: 'Interaction saved.' })
    } catch (error) {
      const err = new Error(error.message || 'Failed to register interaction.')
      err.status = error.status || 500
      err.cause = error
      next(err)
    }
  }
}
