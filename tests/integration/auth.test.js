import { describe, it, before, after } from 'node:test'
import assert from 'node:assert'
import request from 'supertest'
import app from '../../src/app.js'
import pool from '../../src/config/db.js'

before(async () => {
  await pool.query('DELETE FROM refresh_tokens')
  await pool.query('DELETE FROM users')
  await request(app)
    .post('/api/v1/auth/register')
    .send({ email: 'existing@integration.test', password: 'Secret12345', displayName: 'ExistingUser' })
})

after(async () => {
  await pool.query('DELETE FROM refresh_tokens')
  await pool.query('DELETE FROM users')
  await pool.end()
})

describe('POST /api/v1/auth/register', () => {
  it('should register a new user successfully', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({ email: 'register@integration.test', password: 'Secret12345', displayName: 'RegUser' })
    assert.strictEqual(res.status, 201)
  })

  it('should reject duplicate email', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({ email: 'existing@integration.test', password: 'Secret12345', displayName: 'DupUser' })
    assert.strictEqual(res.status, 409)
  })

  it('should reject password shorter than 10 characters', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({ email: 'short@integration.test', password: 'abc', displayName: 'ShortUser' })
    assert.strictEqual(res.status, 400)
  })
})

describe('POST /api/v1/auth/login', () => {
  it('should return a valid JWT on successful login', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'existing@integration.test', password: 'Secret12345' })
    assert.strictEqual(res.status, 200)
    assert.ok(res.body.access_token)
    const parts = res.body.access_token.split('.')
    assert.strictEqual(parts.length, 3)
  })
})

describe('Protected routes', () => {
  it('should reject request without token', async () => {
    const res = await request(app)
      .get('/api/v1/watchlist')
    assert.strictEqual(res.status, 401)
  })

  it('should reject request with invalid token', async () => {
    const res = await request(app)
      .get('/api/v1/watchlist')
      .set('Authorization', 'Bearer invalid.token.here')
    assert.strictEqual(res.status, 401)
  })

  it('should accept request with valid token', async () => {
    const loginRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'existing@integration.test', password: 'Secret12345' })
    const res = await request(app)
      .get('/api/v1/watchlist')
      .set('Authorization', `Bearer ${loginRes.body.access_token}`)
    assert.strictEqual(res.status, 200)
    assert.ok(res.body.movies)
  })

  it('should return a valid token on refresh', async () => {
    const loginRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'existing@integration.test', password: 'Secret12345' })
    const res = await request(app)
      .post('/api/v1/auth/refresh')
      .set('Cookie', loginRes.headers['set-cookie'])
    assert.strictEqual(res.status, 201)
  })
})
