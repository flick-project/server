/**
 * @file Defines the refresh token model.
 * @module models/refreshTokenModel
 * @author Hans Nilsson
 * @version 0.1.0
 */
import crypto from 'node:crypto'
import pool from '../config/db.js'

export const EXPIRY_DAYS = 7

/**
 * Hash a token using SHA-256.
 * @param {string} plainToken - The plaintext refresh token.
 * @returns {string} The hex-encoded hash.
 */
const hashToken = (plainToken) => {
  return crypto.createHash('sha256').update(plainToken).digest('hex')
}

/**
 * Create a refresh token for a user.
 * @param {number} userId - The user's id.
 * @returns {string} The plaintext token (to be sent in a cookie).
 */
export const createToken = async (userId) => {
  const plainToken = crypto.randomBytes(64).toString('hex')
  const hashed = hashToken(plainToken)
  const expiresAt = new Date(Date.now() + (
    process.env.NODE_ENV === 'production'
      ? EXPIRY_DAYS * 24 * 60 * 60 * 1000
      : 10 * 60 * 1000
  ))

  await pool.query(
    'INSERT INTO refresh_tokens (token, user_id, expires_at) VALUES ($1, $2, $3)',
    [hashed, userId, expiresAt]
  )

  return plainToken
}

/**
 * Find a valid refresh token and return its associated user id.
 * @param {string} plainToken - The plaintext refresh token.
 * @returns {object | undefined} The token row, or undefined if not found or expired.
 */
export const findValid = async (plainToken) => {
  const hashed = hashToken(plainToken)
  const result = await pool.query(
    'SELECT * FROM refresh_tokens WHERE token = $1 AND expires_at > NOW()',
    [hashed]
  )
  return result.rows[0]
}

/**
 * Delete a specific refresh token.
 * @param {string} plainToken - The plaintext refresh token to revoke.
 */
export const deleteToken = async (plainToken) => {
  const hashed = hashToken(plainToken)
  await pool.query(
    'DELETE FROM refresh_tokens WHERE token = $1',
    [hashed]
  )
}

/**
 * Delete all refresh tokens for a user.
 * @param {number} userId - The user's id.
 */
export const deleteAllForUser = async (userId) => {
  await pool.query(
    'DELETE FROM refresh_tokens WHERE user_id = $1',
    [userId]
  )
}
