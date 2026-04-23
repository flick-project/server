import { describe, it, before, after } from 'node:test'
import assert from 'node:assert'
import { createUser, authenticate } from '../../src/models/UserModel.js'
import pool from '../../src/config/db.js'

// Register an account.

// Clean up all test users and close pool when done.
after(async () => {
  await pool.query("DELETE FROM users WHERE email LIKE '%@unit.test'")
  await pool.end()
})

describe('createUser', () => {
// Clean up before all tests.
  before(async () => {
    await pool.query("DELETE FROM users WHERE email LIKE '%@unit.test'")
  })

  it('should create a user and return id, email, and created_at', async () => {
    const user = await createUser('unit@unit.test', 'Secret12345', 'TestUser')

    assert.ok(user.id)
    assert.strictEqual(user.email, 'unit@unit.test')
    assert.ok(user.created_at)
  })

  it('should hash the password before storing', async () => {
    const result = await pool.query("SELECT password FROM users WHERE email = 'unit@unit.test'")
    const stored = result.rows[0].password

    assert.notStrictEqual(stored, 'Secret12345')
    assert.ok(stored.startsWith('$2b$'))
  })

  it('should reject missing email', async () => {
    await assert.rejects(
      () => createUser('', 'Secret12345'),
      (err) => {
        assert.strictEqual(err.status, 400)
        return true
      }
    )
  })

  it('should reject short password', async () => {
    await assert.rejects(
      () => createUser('short@unit.test', 'abc'),
      (err) => {
        assert.strictEqual(err.status, 400)
        return true
      }
    )
  })
})

// Log in to the application.

describe('authenticate', () => {
  before(async () => {
    await createUser('auth@unit.test', 'Secret12345')
  })

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
