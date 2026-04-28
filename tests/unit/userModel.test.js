import { describe, it, before, after } from 'node:test'
import assert from 'node:assert'
import { createUser, authenticate } from '../../src/models/userModel.js'
import pool from '../../src/config/db.js'

before(async () => {
  await pool.query("DELETE FROM users WHERE email LIKE '%@unit.test'")
  // Create user for auth tests.
  await createUser('auth@unit.test', 'AuthUser', 'Secret12345')
})

after(async () => {
  await pool.query("DELETE FROM users WHERE email LIKE '%@unit.test'")
  await pool.end()
})

describe('createUser', () => {
  it('should create a user and return id, email, and created_at', async () => {
    const user = await createUser('unit@unit.test', 'TestUser', 'Secret12345')
    assert.ok(user.id)
    assert.strictEqual(user.email, 'unit@unit.test')
    assert.ok(user.created_at)
  })

  it('should hash the password before storing', async () => {
    const result = await pool.query("SELECT password_hash FROM users WHERE email = 'unit@unit.test'")
    const stored = result.rows[0].password_hash
    assert.notStrictEqual(stored, 'Secret12345')
    assert.ok(stored.startsWith('$2b$'))
  })

  it('should reject missing email', async () => {
    await assert.rejects(
      () => createUser('', 'TestUser', 'Secret12345'),
      (err) => {
        assert.strictEqual(err.status, 400)
        return true
      }
    )
  })

  it('should reject short password', async () => {
    await assert.rejects(
      () => createUser('short@unit.test', 'ShortUser', 'abc'),
      (err) => {
        assert.strictEqual(err.status, 400)
        return true
      }
    )
  })
})

describe('authenticate', () => {
  it('should return user data on valid credentials', async () => {
    const user = await authenticate('auth@unit.test', 'Secret12345')
    assert.ok(user.id)
    assert.strictEqual(user.email, 'auth@unit.test')
    assert.ok(user.created_at)
  })

  it('should not return the password', async () => {
    const user = await authenticate('auth@unit.test', 'Secret12345')
    assert.strictEqual(user.password, undefined)
  })

  it('should reject wrong password', async () => {
    await assert.rejects(
      () => authenticate('auth@unit.test', 'WrongPassword1'),
      (err) => {
        assert.strictEqual(err.status, 401)
        return true
      }
    )
  })

  it('should reject non-existent email', async () => {
    await assert.rejects(
      () => authenticate('nobody@unit.test', 'Secret12345'),
      (err) => {
        assert.strictEqual(err.status, 401)
        return true
      }
    )
  })
})
