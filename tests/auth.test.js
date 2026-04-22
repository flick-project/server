import { describe, it, before, after } from 'node:test'
import assert from 'node:assert'
import request from 'supertest'
import app from '../src/app.js'
import pool from '../src/config/db.js'

describe('POST /api/v1/auth/register', () => {
  // Clean up test users before and after tests.
  before(async () => {
    await pool.query("DELETE FROM users WHERE email LIKE '%@test.com'")
  })

  after(async () => {
    await pool.query("DELETE FROM users WHERE email LIKE '%@test.com'")
    await pool.end()
  })

  it('should register a new user successfully', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({ email: 'register@test.com', password: 'Secret12345' })

    assert.strictEqual(res.status, 201)
    assert.strictEqual(res.body.message, 'Registration successful.')
  })

  it('should reject duplicate email', async () => {
    // First registration.
    await request(app)
      .post('/api/v1/auth/register')
      .send({ email: 'duplicate@test.com', password: 'Secret12345' })

    // Second registration with same email.
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({ email: 'duplicate@test.com', password: 'Secret12345' })

    assert.strictEqual(res.status, 409)
  })

  it('should reject password shorter than 10 characters', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({ email: 'short@test.com', password: 'abc' })

    assert.strictEqual(res.status, 400)
  })
})
