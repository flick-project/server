import { describe, it, before, after, mock } from 'node:test'
import assert from 'node:assert'
import request from 'supertest'
import pool from '../../src/config/db.js'

mock.method(console, 'error', () => {})

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

await mock.module('../../src/services/tmdbServices.js', {
  namedExports: {
    discoverMovies: mock.fn(async () => ({ results: [] })),
    searchMovies: mock.fn(async () => ({ results: [] })),
    fetchMovieKeywords: mock.fn(async () => []),
    fetchRecommendations: mock.fn(async () => ({ results: [] }))
  }
})

const { default: app } = await import('../../src/app.js')
const { createMovie } = await import('../../src/models/movieModel.js')

// Create test movie and test user.
before(async () => {
  await pool.query('DELETE FROM movie_interactions')
  await pool.query('DELETE FROM movies')
  await pool.query('DELETE FROM users')
  await createMovie(testMovie)
  await request(app)
    .post('/api/v1/auth/register')
    .send({ email: 'register@integration.test', displayName: 'RegUser', password: 'Secret12345' })
})

after(async () => {
  await pool.query('DELETE FROM movie_interactions')
  await pool.query('DELETE FROM movies')
  await pool.query('DELETE FROM users')
  await pool.end()
})

describe('POST /api/v1/movies/interact', () => {
  let token

  before(async () => {
    const loginRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'register@integration.test', password: 'Secret12345' })
    token = `Bearer ${loginRes.body.access_token}`
  })

  it('should return 200 on valid interaction', async () => {
    const res = await request(app)
      .post('/api/v1/movies/interact')
      .set('Authorization', token)
      .send({ movieId: -1, interaction: 'saved' })
    assert.strictEqual(res.status, 200)
  })

  it('should return 401 without auth token', async () => {
    const res = await request(app)
      .post('/api/v1/movies/interact')
      .send({ movieId: -1, interaction: 'saved' })
    assert.strictEqual(res.status, 401)
  })

  it('should reject invalid interaction type', async () => {
    const res = await request(app)
      .post('/api/v1/movies/interact')
      .set('Authorization', token)
      .send({ movieId: -1, interaction: 'saevd' })
    assert.strictEqual(res.status, 400)
  })
})
