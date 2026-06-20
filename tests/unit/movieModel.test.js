import { describe, it, before, after } from 'node:test'
import assert from 'node:assert'
import pool from '../../src/config/db.js'
import { create } from '../../src/models/movieModel.js'

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

before(async () => {
  await pool.query('DELETE FROM movies WHERE tmdb_id < 0')
  // Create movie for testing.
  await create(testMovie)
})

after(async () => {
  await pool.query('DELETE FROM movies WHERE tmdb_id < 0')
  await pool.end()
})

describe('create', () => {
  it('should insert a movie with correct fields', async () => {
    const result = await pool.query('SELECT * FROM movies WHERE tmdb_id = -1')
    const stored = result.rows[0]
    assert.strictEqual(stored.tmdb_id, testMovie.id)
    assert.strictEqual(stored.title, testMovie.title)
  })

  it('should skip insert on duplicate movie', async () => {
    await create(testMovie)
  })

  it('should reject null movie', async () => {
    await assert.rejects(
      () => create(null),
      (err) => {
        assert.strictEqual(err.status, 400)
        return true
      }
    )
  })

  it('should reject missing movie id', async () => {
    await assert.rejects(
      () => create({ title: 'INVALID_TITLE' }),
      (err) => {
        assert.strictEqual(err.status, 400)
        return true
      }
    )
  })

  it('should reject missing movie title', async () => {
    await assert.rejects(
      () => create({ id: -2 }),
      (err) => {
        assert.strictEqual(err.status, 400)
        return true
      }
    )
  })
})
