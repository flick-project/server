import { describe, it, before, after } from 'node:test'
import assert from 'node:assert'
import request from 'supertest'
import pool from '../../src/config/db.js'
import app from '../../src/app.js'
import { createMovie } from '../../src/models/movieModel.js'

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

// Create test movie and test user.
before(async () => {
  await pool.query('DELETE FROM movie_interactions WHERE movie_id < 0')
  await pool.query('DELETE FROM movies WHERE tmdb_id < 0')
  await pool.query("DELETE FROM users WHERE email LIKE '%@integration.test'")
  await createMovie(testMovie)
  await request(app)
    .post('/api/v1/auth/register')
    .send({ email: 'register@integration.test', displayName: 'RegUser', password: 'Secret12345' })
})

after(async () => {
  await pool.query('DELETE FROM movie_interactions WHERE movie_id < 0')
  await pool.query('DELETE FROM movies WHERE tmdb_id < 0')
  await pool.query("DELETE FROM users WHERE email LIKE '%@integration.test'")
  await pool.end()
})

describe('POST /api/v1/movies/interact', () => {
  it('should return 200 on valid interaction', async () => {
    const loginRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'register@integration.test', password: 'Secret12345' })

    const res = await request(app)
      .post('/api/v1/movies/interact')
      .set('Authorization', `Bearer ${loginRes.body.token}`)
      .send({ movieId: -1, interaction: 'saved' })
    assert.strictEqual(res.status, 200)
  })

  it('should return 401 without auth token', async () => {
    const res = await request(app)
      .post('/api/v1/movies/interact')
      .send({ movieId: -1, interaction: 'saved' })
    assert.strictEqual(res.status, 401)
  })
})
