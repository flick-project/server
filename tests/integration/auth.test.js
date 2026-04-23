import { describe, it, before, after } from 'node:test'
import assert from 'node:assert'
import request from 'supertest'
import app from '../../src/app.js'
import pool from '../../src/config/db.js'

// Clean up all test users and close pool when done.
after(async () => {
  await pool.query("DELETE FROM users WHERE email LIKE '%@integration.test'")
  await pool.end()
})

// Register an account.

describe('POST /api/v1/auth/register', () => {
  // Clean up all test users before testing.
  before(async () => {
    await pool.query("DELETE FROM users WHERE email LIKE '%@test.com'")
  })

  it('should register a new user successfully', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({ email: 'register@integration.test', password: 'Secret12345' })

    assert.strictEqual(res.status, 201)
    assert.strictEqual(res.body.message, 'Registration successful.')
  })

  it('should reject duplicate email', async () => {
    // First registration.
    await request(app)
      .post('/api/v1/auth/register')
      .send({ email: 'duplicate@integration.test', password: 'Secret12345' })

    // Second registration with same email.
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({ email: 'duplicate@integration.test', password: 'Secret12345' })

    assert.strictEqual(res.status, 409)
  })

  it('should reject password shorter than 10 characters', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({ email: 'short@test.com', password: 'abc' })

    assert.strictEqual(res.status, 400)
  })
})

// Log in to the application.

describe('POST /api/v1/auth/login', () => {
  before(async () => {
    // Create a test user to log in with.
    await request(app)
      .post('/api/v1/auth/register')
      .send({ email: 'login@integration.test', password: 'Secret12345' })
  })

  it('should return a valid JWT on successful login', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'login@integration.test', password: 'Secret12345' })

    assert.strictEqual(res.status, 200)
    assert.ok(res.body.token)

    // JWT has three parts separated by dots.
    const parts = res.body.token.split('.')
    assert.strictEqual(parts.length, 3)
  })
})

// Protect routes.

describe('Protected routes', () => {
  before(async () => {
    await request(app)
      .post('/api/v1/auth/register')
      .send({ email: 'protected@integration.test', password: 'Secret12345' })
  })

  it('should reject request without token', async () => {
    const res = await request(app)
      .get('/api/v1/user/profile')

    assert.strictEqual(res.status, 401)
  })

  it('should reject request with invalid token', async () => {
    const res = await request(app)
      .get('/api/v1/user/profile')
      .set('Authorization', 'Bearer invalid.token.here')

    assert.strictEqual(res.status, 401)
  })

  it('should accept request with valid token', async () => {
    const loginRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'protected@integration.test', password: 'Secret12345' })

    const res = await request(app)
      .get('/api/v1/user/profile')
      .set('Authorization', `Bearer ${loginRes.body.token}`)

    assert.strictEqual(res.status, 200)
    assert.ok(res.body.user)
  })
})
