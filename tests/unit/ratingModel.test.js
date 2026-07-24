import { describe, it, before, after } from 'node:test'
import assert from 'node:assert'
import pool from '../../src/config/db.js'
import { createUser } from '../../src/models/userModel.js'
import { create } from '../../src/models/movieModel.js'
import { createRatingIfAbsent, findUnprocessed, markProcessed } from '../../src/models/ratingModel.js'

const testMovie1 = {
  id: -1,
  release_date: '2026-01-01',
  title: 'TEST_RATING_1',
  genre_ids: [28],
  poster_path: '/test.jpg',
  vote_average: 7.5,
  vote_count: 100,
  overview: 'Test movie 1.'
}

const testMovie2 = {
  id: -2,
  release_date: '2026-01-01',
  title: 'TEST_RATING_2',
  genre_ids: [12],
  poster_path: '/test.jpg',
  vote_average: 8.0,
  vote_count: 200,
  overview: 'Test movie 2.'
}

let userId

before(async () => {
  await pool.query('DELETE FROM ratings')
  await pool.query('DELETE FROM movies WHERE tmdb_id < 0')
  await pool.query("DELETE FROM users WHERE email LIKE '%@unit.test'")
  const user = await createUser('rating@unit.test', 'RatingUser', 'Secret12345')
  userId = user.id
  await create(testMovie1)
  await create(testMovie2)
})

after(async () => {
  await pool.query('DELETE FROM ratings')
  await pool.query('DELETE FROM movies WHERE tmdb_id < 0')
  await pool.query("DELETE FROM users WHERE email LIKE '%@unit.test'")
  await pool.end()
})

describe('createRatingIfAbsent', () => {
  it('should create a rating and return true', async () => {
    const created = await createRatingIfAbsent(userId, -1, 'love')
    assert.strictEqual(created, true)
  })

  it('should skip duplicate and return false', async () => {
    const created = await createRatingIfAbsent(userId, -1, 'love')
    assert.strictEqual(created, false)
  })

  it('should reject invalid rating type', async () => {
    await assert.rejects(
      () => createRatingIfAbsent(userId, -2, 'amazing'),
      (err) => {
        assert.strictEqual(err.status, 400)
        return true
      }
    )
  })
})

describe('findUnprocessed', () => {
  before(async () => {
    await pool.query('DELETE FROM ratings')
    await createRatingIfAbsent(userId, -1, 'love')
    await createRatingIfAbsent(userId, -2, 'like')
  })

  it('should return unprocessed love and like ratings', async () => {
    const rows = await findUnprocessed(userId)
    assert.strictEqual(rows.length, 2)
  })

  it('should respect the limit parameter', async () => {
    const rows = await findUnprocessed(userId, 1)
    assert.strictEqual(rows.length, 1)
  })

  it('should not return processed ratings', async () => {
    await markProcessed(userId, -1)
    const rows = await findUnprocessed(userId)
    assert.strictEqual(rows.length, 1)
    assert.strictEqual(rows[0].movie_id, -2)
  })
})

describe('markProcessed', () => {
  it('should mark a rating as processed', async () => {
    await markProcessed(userId, -2)
    const rows = await findUnprocessed(userId)
    assert.strictEqual(rows.length, 0)
  })
})
