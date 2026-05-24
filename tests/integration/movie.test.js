import { describe, it, after, before, mock, beforeEach } from 'node:test'
import assert from 'node:assert'
import request from 'supertest'
import pool from '../../src/config/db.js'

const testMovieA = {
  id: -1,
  release_date: '2026-01-01',
  title: 'TEST_MOVIE_A',
  genre_ids: [28, 12],
  poster_path: '/test.jpg',
  vote_average: 7.5,
  vote_count: 100,
  overview: 'A test movie.'
}

const testMovieB = {
  id: -2,
  release_date: '2026-01-01',
  title: 'TEST_MOVIE_B',
  genre_ids: [28, 12],
  poster_path: '/test.jpg',
  vote_average: 7.5,
  vote_count: 100,
  overview: 'Another test movie.'
}

const mockFetch = mock.fn(async () => ({
  results: [testMovieA, testMovieB]
}))

// Must be defined before app import to intercept TMDB calls.
await mock.module('../../src/services/tmdbServices.js', {
  namedExports: {
    discoverMovies: mockFetch,
    searchMovies: mockFetch,
    fetchMovieKeywords: mock.fn(async () => []),
    fetchRecommendations: mock.fn(async () => ({ results: [] }))
  }
})

const { default: app } = await import('../../src/app.js')

before(async () => {
  await pool.query('DELETE FROM movie_interactions')
  await pool.query('DELETE FROM movies')
  await pool.query("DELETE FROM users WHERE email LIKE '%@integration.test'")

  await request(app)
    .post('/api/v1/auth/register')
    .send({ email: 'discover@integration.test', displayName: 'DiscoverUser', password: 'Secret12345' })
})

// Clean slate for each test.
beforeEach(async () => {
  await pool.query('DELETE FROM movie_interactions')
  await pool.query('DELETE FROM movies')
})

after(async () => {
  await pool.query('DELETE FROM movie_interactions')
  await pool.query('DELETE FROM movies')
  await pool.query("DELETE FROM users WHERE email LIKE '%@integration.test'")
  await pool.end()
})

describe('GET /api/v1/movies/discover', () => {
  let token

  before(async () => {
    const loginRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'discover@integration.test', password: 'Secret12345' })
    token = `Bearer ${loginRes.body.access_token}`
  })

  it('should return movies for unauthenticated user', async () => {
    const res = await request(app)
      .get('/api/v1/movies/discover')
    assert.strictEqual(res.status, 200)
    assert.strictEqual(res.body.movies.length, 2)
  })

  it('should filter out interacted movies for authenticated user', async () => {
    // Stock the DB with test movies.
    await request(app)
      .get('/api/v1/movies/discover')
      .set('Authorization', token)

    // Save movie A.
    await request(app)
      .post('/api/v1/movies/interact')
      .set('Authorization', token)
      .send({ movieId: -1, interaction: 'saved' })

    // Movie A should be filtered out.
    const res = await request(app)
      .get('/api/v1/movies/discover')
      .set('Authorization', token)
    assert.strictEqual(res.status, 200)
    const movieIds = res.body.movies.map(m => m.id)
    assert.ok(!movieIds.includes(-1), 'Saved movie should be filtered out')
    assert.ok(movieIds.includes(-2), 'Unseen movie should still appear')
  })

  it('should return 500 when TMDB fetch fails', async () => {
    mockFetch.mock.mockImplementationOnce(() => {
      throw new Error('TMDB unavailable')
    })
    const res = await request(app)
      .get('/api/v1/movies/discover')
    assert.strictEqual(res.status, 500)
  })
})
