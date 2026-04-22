import { describe, it, after } from 'node:test'
import assert from 'node:assert'
import { createUser } from '../../src/models/UserModel.js'
import pool from '../../src/config/db.js'

// Registration tests.

describe('createUser', () => {
  after(async () => {
    await pool.query("DELETE FROM users WHERE email LIKE '%@test.com'")
    await pool.end()
  })

  it('should create a user and return id, email, and created_at', async () => {
    const user = await createUser('unit@test.com', 'Secret12345')

    assert.ok(user.id)
    assert.strictEqual(user.email, 'unit@test.com')
    assert.ok(user.created_at)
  })

  it('should hash the password before storing', async () => {
    const result = await pool.query("SELECT password FROM users WHERE email = 'unit@test.com'")
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
      () => createUser('short@test.com', 'abc'),
      (err) => {
        assert.strictEqual(err.status, 400)
        return true
      }
    )
  })
})
