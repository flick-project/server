/**
 * @file Import controller for importing movie ratings from third party sources.
 * @module controllers/api/ImportController
 * @author Hans Nilsson
 */

import { BaseController } from './BaseController.js'
import { ensureExists, create } from '../../models/movieModel.js'
import { searchMovies, findByImdbId, fetchMovieKeywords } from '../../services/tmdbServices.js'
import { createRatingIfAbsent } from '../../models/ratingModel.js'
import { storeKeywords } from '../../models/movieModel.js'
import { peopleEnricher } from '../../services/enrichers/peopleEnricher.js'
import { addToPool } from '../../services/pool/pool.js'
import pool from '../../config/db.js'

export class ImportController extends BaseController {
  /**
   * Imports movie ratings from third party sources via SSE.
   * Streams progress updates to the client as each entry is processed.
   * Continues processing even if the client disconnects.
   * @param {object} req - Express's request object.
   * @param {object} res - Express's response object.
   * @param {(error: Error) => void} next - Express's next function.
   * @returns {void}
   */
  async import (req, res, next) {
    try {
      const { ratings } = req.body

      if (!Array.isArray(ratings) || ratings.length === 0) {
        return res.status(400).json({ message: 'No ratings provided.' })
      }

      res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive'
      })

      const userId = req.user.id
      const total = ratings.length
      let imported = 0
      let skipped = 0
      let notFound = 0
      let processed = 0

      const send = (data) => {
        try { res.write(`data: ${JSON.stringify(data)}\n\n`) } catch { /* client gone */ }
      }

      for (const entry of ratings) {
        try {
          let tmdbId

          if (entry.tmdbId) {
            tmdbId = entry.tmdbId
            await ensureExists(tmdbId)
          } else if (entry.imdbId) {
            const existing = await pool.query(
              'SELECT tmdb_id, keyword_ids FROM movies WHERE imdb_id = $1',
              [entry.imdbId]
            )

            if (existing.rows[0]) {
              tmdbId = existing.rows[0].tmdb_id
            } else {
              const movie = await findByImdbId(entry.imdbId)
              if (!movie?.id) { notFound++; processed++; send({ processed, total, imported, skipped, notFound }); continue }
              tmdbId = movie.id
              await create({
                id: movie.id,
                title: movie.title,
                release_date: movie.release_date ?? null,
                genre_ids: movie.genre_ids ?? [],
                poster_path: movie.poster_path ?? '',
                vote_average: movie.vote_average ?? 0,
                vote_count: movie.vote_count ?? 0,
                overview: movie.overview ?? '',
                imdb_id: entry.imdbId
              })
            }
          } else if (entry.title && entry.year) {
            const result = await searchMovies(entry.title)
            const match = result.results?.find(m =>
              new Date(m.release_date).getFullYear() === entry.year
            )
            if (!match) { notFound++; processed++; send({ processed, total, imported, skipped, notFound }); continue }
            tmdbId = match.id
            await ensureExists(tmdbId)
          }

          if (!tmdbId) { notFound++; processed++; send({ processed, total, imported, skipped, notFound }); continue }

          const movieRow = await pool.query(
            'SELECT keyword_ids FROM movies WHERE tmdb_id = $1',
            [tmdbId]
          )
          if (!movieRow.rows[0]?.keyword_ids?.length) {
            const keywords = await fetchMovieKeywords(tmdbId)
            await storeKeywords(tmdbId, keywords)
          }

          const created = await createRatingIfAbsent(userId, tmdbId, entry.rating)
          created ? imported++ : skipped++
        } catch (err) {
          console.error('Failed on entry:', entry, err.message)
          notFound++
        }

        processed++
        send({ processed, total, imported, skipped, notFound })
      }

      send({ done: true, imported, skipped, notFound })
      res.end()

      // Seed the pool in the background after import.
      ;(async () => {
        const items = await peopleEnricher.enrich(userId)
        await addToPool(userId, items)
      })().catch(console.error)
    } catch (error) {
      if (!res.headersSent) {
        this.handleControllerError(error, 'Failed to import ratings.', next)
      }
    }
  }
}
