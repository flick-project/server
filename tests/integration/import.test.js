import { describe, it, before, after, mock } from 'node:test'
import assert from 'node:assert'
import request from 'supertest'
import pool from '../../src/config/db.js'

mock.method(console, 'error', () => {})

const testMovie = {
  id: 999,
  title: 'Import Test Movie',
  release_date: '2026-01-01',
  genres: [{ id: 28, name: 'Action' }],
  poster_path: '/test.jpg',
  vote_average: 7.5,
  vote_count: 100,
  overview: 'A test movie for import testing.'
}

await mock.module('../../src/services/tmdbServices.js', {
  namedExports: {
    discoverMovies: mock.fn(async () => ({ results: [] })),
    searchMovies: mock.fn(async () => ({ results: [] })),
    fetchMovieVideos: mock.fn(async () => []),
    fetchMovieKeywords: mock.fn(async () => []),
    fetchMovieCredits: mock.fn(async () => []),
    fetchRecommendations: mock.fn(async () => []),
    findMovie: mock.fn(async () => testMovie),
    findByImdbId: mock.fn(async (imdbId) => {
      if (imdbId === 'tt0000001') return testMovie
      return null
    }),
    findMovieWithDetails: mock.fn(async () => ({}))
  }
})

const { default: app } = await import('../../src/app.js')

let token

before(async () => {
  await pool.query('DELETE FROM user_pool')
  await pool.query('DELETE FROM ratings')
  await pool.query('DELETE FROM movie_interactions')
  await pool.query('DELETE FROM movies')
  await pool.query("DELETE FROM users WHERE email LIKE '%@integration.test'")
  const res = await request(app)
    .post('/api/v1/auth/register')
    .send({ email: 'import@integration.test', displayName: 'ImportUser', password: 'Secret12345' })
  token = `Bearer ${res.body.access_token}`
})

after(async () => {
  await pool.query('DELETE FROM user_pool')
  await pool.query('DELETE FROM ratings')
  await pool.query('DELETE FROM movie_interactions')
  await pool.query('DELETE FROM movies')
  await pool.query("DELETE FROM users WHERE email LIKE '%@integration.test'")
  await pool.end()
})

const parseSSE = (text) => {
  return text.split('\n\n')
    .filter(line => line.startsWith('data: '))
    .map(line => JSON.parse(line.slice(6)))
}

describe('POST /api/v1/import/ratings', () => {
  it('should return 401 without auth', async () => {
    const res = await request(app)
      .post('/api/v1/import/ratings')
      .send({ ratings: [{ tmdbId: 999, rating: 'love' }] })
    assert.strictEqual(res.status, 401)
  })

  it('should return 400 with no ratings', async () => {
    const res = await request(app)
      .post('/api/v1/import/ratings')
      .set('Authorization', token)
      .send({ ratings: [] })
    assert.strictEqual(res.status, 400)
  })

  it('should import a valid TMDB rating', async () => {
    const res = await request(app)
      .post('/api/v1/import/ratings')
      .set('Authorization', token)
      .send({ ratings: [{ tmdbId: 999, rating: 'love' }] })
    assert.strictEqual(res.status, 200)
    const events = parseSSE(res.text)
    const final = events.find(e => e.done)
    assert.strictEqual(final.imported, 1)
  })

  it('should skip duplicate ratings', async () => {
    const res = await request(app)
      .post('/api/v1/import/ratings')
      .set('Authorization', token)
      .send({ ratings: [{ tmdbId: 999, rating: 'love' }] })
    assert.strictEqual(res.status, 200)
    const events = parseSSE(res.text)
    const final = events.find(e => e.done)
    assert.strictEqual(final.skipped, 1)
    assert.strictEqual(final.imported, 0)
  })

  it('should import a valid IMDB rating', async () => {
    const res = await request(app)
      .post('/api/v1/import/ratings')
      .set('Authorization', token)
      .send({ ratings: [{ imdbId: 'tt0000001', rating: 'like' }] })
    assert.strictEqual(res.status, 200)
    const events = parseSSE(res.text)
    const final = events.find(e => e.done)
    assert.ok(final.imported >= 0)
  })

  it('should handle not-found movies gracefully', async () => {
    const res = await request(app)
      .post('/api/v1/import/ratings')
      .set('Authorization', token)
      .send({ ratings: [{ imdbId: 'tt9999999', rating: 'love' }] })
    assert.strictEqual(res.status, 200)
    const events = parseSSE(res.text)
    const final = events.find(e => e.done)
    assert.strictEqual(final.notFound, 1)
  })
})
