import { describe, it, after, before, mock, beforeEach } from 'node:test'
import assert from 'node:assert'
import request from 'supertest'
import pool from '../../src/config/db.js'

mock.method(console, 'error', () => {})

const testMovies = Array.from({ length: 20 }, (_, i) => ({
  id: -(i + 1),
  release_date: '2026-01-01',
  title: `TEST_MOVIE_${i + 1}`,
  genre_ids: [28, 12],
  poster_path: '/test.jpg',
  vote_average: 7.5,
  vote_count: 100,
  overview: 'A test movie.'
}))

const mockDiscover = mock.fn(async () => ({
  results: testMovies
}))

await mock.module('../../src/services/tmdbServices.js', {
  namedExports: {
    discoverMovies: mockDiscover,
    searchMovies: mock.fn(async () => ({ results: [] })),
    fetchMovieVideos: mock.fn(async () => []),
    fetchMovieKeywords: mock.fn(async () => []),
    fetchMovieCredits: mock.fn(async () => []),
    fetchRecommendations: mock.fn(async () => []),
    findMovie: mock.fn(async () => ({})),
    findByImdbId: mock.fn(async () => null),
    findMovieWithDetails: mock.fn(async () => ({}))
  }
})

const { default: app } = await import('../../src/app.js')

const insertTestMovies = async (userId) => {
  for (const movie of testMovies) {
    await pool.query(
      'INSERT INTO movies (tmdb_id, release_date, title, genre_ids, poster_path, vote_average, vote_count, overview) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) ON CONFLICT DO NOTHING',
      [movie.id, movie.release_date, movie.title, movie.genre_ids, movie.poster_path, movie.vote_average, movie.vote_count, movie.overview]
    )
    await pool.query(
      'INSERT INTO user_pool (user_id, movie_id, source) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING',
      [userId, movie.id, 'discover']
    )
  }
}

before(async () => {
  await pool.query('DELETE FROM user_pool')
  await pool.query('DELETE FROM movie_interactions')
  await pool.query('DELETE FROM movies')
  await pool.query("DELETE FROM users WHERE email LIKE '%@integration.test'")
  await request(app)
    .post('/api/v1/auth/register')
    .send({ email: 'discover@integration.test', displayName: 'DiscoverUser', password: 'Secret12345' })
})

beforeEach(async () => {
  await pool.query('DELETE FROM user_pool')
  await pool.query('DELETE FROM movie_interactions')
  await pool.query('DELETE FROM movies')
})

after(async () => {
  await pool.query('DELETE FROM user_pool')
  await pool.query('DELETE FROM movie_interactions')
  await pool.query('DELETE FROM movies')
  await pool.query("DELETE FROM users WHERE email LIKE '%@integration.test'")
  await pool.end()
})

describe('GET /api/v1/movies/discover', () => {
  let token
  let userId

  before(async () => {
    const loginRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'discover@integration.test', password: 'Secret12345' })
    token = `Bearer ${loginRes.body.access_token}`
    const payload = JSON.parse(Buffer.from(loginRes.body.access_token.split('.')[1], 'base64').toString())
    userId = payload.id
  })

  it('should return a single movie for unauthenticated user', async () => {
    const res = await request(app)
      .get('/api/v1/movies/discover')
    assert.strictEqual(res.status, 200)
    assert.strictEqual(res.body.movies.length, 1)
  })

  it('should filter out interacted movies for authenticated user', async () => {
    await insertTestMovies(userId)

    await request(app)
      .post('/api/v1/interactions')
      .set('Authorization', token)
      .send({ movieId: -1, interaction: 'saved' })

    const res = await request(app)
      .get('/api/v1/movies/discover')
      .set('Authorization', token)
    assert.strictEqual(res.status, 200)
    const movieIds = res.body.movies.map(m => m.id)
    assert.ok(!movieIds.includes(-1), 'Saved movie should be filtered out')
  })

  it('should return 500 when TMDB fetch fails', async () => {
    mockDiscover.mock.mockImplementationOnce(() => {
      throw new Error('TMDB unavailable')
    })
    const res = await request(app)
      .get('/api/v1/movies/discover')
    assert.strictEqual(res.status, 500)
  })
})
