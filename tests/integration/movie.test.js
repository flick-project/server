import { describe, it, after, mock } from 'node:test'
import assert from 'node:assert'
import request from 'supertest'
import pool from '../../src/config/db.js'

const testMovie = {
  id: -1,
  release_date: '2026-01-01',
  title: 'TEST_MOVIE',
  genre_ids: [28, 12],
  poster_path: '/test.jpg',
  vote_average: 7.5,
  vote_count: 100,
  overview: 'A test movie for unit testing.'
}

const mockFetch = mock.fn(() => ({
  results: [testMovie]
}))

// Mocks movie fetch instead of hitting up the actual API.
// Needs to be defined before app import since it intercepts it.
await mock.module('../../src/services/tmdbServices.js', {
  namedExports: { fetchDiscoverMovies: mockFetch }
})

const { default: app } = await import('../../src/app.js')

after(async () => {
  await pool.query('DELETE FROM movies WHERE tmdb_id < 0')
  await pool.end()
})

describe('GET /api/v1/movies/discover', () => {
  it('should return movies from TMDB', async () => {
    const res = await request(app)
      .get('/api/v1/movies/discover')
    assert.strictEqual(res.status, 200)
    assert.deepStrictEqual(res.body.movies[0], testMovie)
  })

  it('should return 500 when movie fetch fails', async () => {
    mockFetch.mock.mockImplementationOnce(() => {
      throw new Error('TMDB unavailable')
    })

    const res = await request(app)
      .get('/api/v1/movies/discover')
    assert.strictEqual(res.status, 500)
  })
})
