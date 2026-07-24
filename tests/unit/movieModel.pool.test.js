import { describe, it, before, after } from 'node:test'
import assert from 'node:assert'
import pool from '../../src/config/db.js'
import { createUser } from '../../src/models/userModel.js'
import { create, addToUserPool, findFromPool, countPool, findExistingInteractions } from '../../src/models/movieModel.js'

const testMovies = Array.from({ length: 5 }, (_, i) => ({
  id: -(i + 1),
  release_date: '2026-01-01',
  title: `POOL_TEST_${i + 1}`,
  genre_ids: [28],
  poster_path: '/test.jpg',
  vote_average: 7.5,
  vote_count: 100,
  overview: 'Pool test movie.'
}))

let userId

before(async () => {
  await pool.query('DELETE FROM user_pool')
  await pool.query('DELETE FROM ratings')
  await pool.query('DELETE FROM movie_interactions')
  await pool.query('DELETE FROM movies WHERE tmdb_id < 0')
  await pool.query("DELETE FROM users WHERE email LIKE '%@unit.test'")
  const user = await createUser('pool@unit.test', 'PoolUser', 'Secret12345')
  userId = user.id
  for (const movie of testMovies) {
    await create(movie)
  }
})

after(async () => {
  await pool.query('DELETE FROM user_pool')
  await pool.query('DELETE FROM ratings')
  await pool.query('DELETE FROM movie_interactions')
  await pool.query('DELETE FROM movies WHERE tmdb_id < 0')
  await pool.query("DELETE FROM users WHERE email LIKE '%@unit.test'")
  await pool.end()
})

describe('addToUserPool', () => {
  it('should add a movie to the user pool', async () => {
    await addToUserPool(userId, -1, 'discover')
    const count = await countPool(userId)
    assert.strictEqual(count, 1)
  })

  it('should skip duplicates', async () => {
    await addToUserPool(userId, -1, 'discover')
    const count = await countPool(userId)
    assert.strictEqual(count, 1)
  })

  it('should add enriched movies', async () => {
    await addToUserPool(userId, -2, 'enriched')
    const count = await countPool(userId)
    assert.strictEqual(count, 2)
  })
})

describe('findFromPool', () => {
  it('should prioritize enriched over discover', async () => {
    const movies = await findFromPool(userId, 10)
    assert.strictEqual(movies[0].id, -2)
  })

  it('should exclude interacted movies', async () => {
    await pool.query(
      'INSERT INTO movie_interactions (user_id, movie_id, interaction) VALUES ($1, $2, $3)',
      [userId, -2, 'saved']
    )
    const movies = await findFromPool(userId, 10)
    const ids = movies.map(m => m.id)
    assert.ok(!ids.includes(-2))
  })

  it('should exclude rated movies', async () => {
    await pool.query(
      'INSERT INTO ratings (user_id, movie_id, rating) VALUES ($1, $2, $3)',
      [userId, -1, 'love']
    )
    const movies = await findFromPool(userId, 10)
    const ids = movies.map(m => m.id)
    assert.ok(!ids.includes(-1))
  })
})

describe('countPool', () => {
  it('should exclude interacted and rated movies from count', async () => {
    await addToUserPool(userId, -3, 'discover')
    const count = await countPool(userId)
    assert.strictEqual(count, 1)
  })
})

describe('findExistingInteractions', () => {
  it('should return interacted and rated movie IDs', async () => {
    const existing = await findExistingInteractions(userId, [-1, -2, -3, -4])
    assert.ok(existing.has(-1))
    assert.ok(existing.has(-2))
    assert.ok(!existing.has(-3))
    assert.ok(!existing.has(-4))
  })

  it('should return empty set for no matches', async () => {
    const existing = await findExistingInteractions(userId, [-99])
    assert.strictEqual(existing.size, 0)
  })
})
