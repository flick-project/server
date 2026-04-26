/**
 * @file Defines the user model.
 * @module models/userModel
 * @author Hans Nilsson
 * @version 0.1.0
 */

import bcrypt from 'bcryptjs'
import pool from '../config/db.js'

const DUMMY_HASH = '$2b$10$yxKgfbXVKer.RvJHITU4ru6mzDD6.U4qYv/lnH7KmgXb2pnrXokFm'

/**
 * Validate user input for registration.
 * @param {string} email - The user's email.
 * @param {string} displayName - The user's display name.
 * @param {string} password - The user's password.
 * @throws {Error} If validation fails.
 */
const validate = (email, displayName, password) => {
  if (!email || !password) {
    const error = new Error('Email and password are required.')
    error.status = 400
    throw error
  }

  if (displayName !== undefined) {
    if (displayName.length < 2 || displayName.length > 50) {
      const error = new Error('Nickname must be between 2 and 50 characters.')
      error.status = 400
      throw error
    }

    if (!/^[a-zA-Z0-9_-]+$/.test(displayName)) {
      const error = new Error('Nickname can only contain letters, numbers, underscores, and hyphens.')
      error.status = 400
      throw error
    }
  }

  if (password.length < 10) {
    const error = new Error('Password must be at least 10 characters.')
    error.status = 400
    throw error
  }
}

/**
 * Create a new user.
 * @param {string} email - The user's email.
 * @param {string} displayName - The user's display name.
 * @param {string} password - The user's plain text password.
 * @returns {object} The created user row.
 */
export const createUser = async (email, displayName, password) => {
  validate(email, displayName, password)

  const hashedPassword = await bcrypt.hash(password, 10)
  const result = await pool.query(
    'INSERT INTO users (email, display_name, password_hash) VALUES ($1, $2, $3) RETURNING id, email, display_name, created_at',
    [email, displayName, hashedPassword]
  )
  return result.rows[0]
}

/**
 * Find a user by email.
 * @param {string} email - The email to search for.
 * @returns {object | undefined} The user row, or undefined if not found.
 */
export const findByEmail = async (email) => {
  const result = await pool.query(
    'SELECT * FROM users WHERE email = $1',
    [email]
  )
  return result.rows[0]
}

/**
 * Authenticate a user by email and password.
 * @param {string} email - The user's email.
 * @param {string} password - The user's plain text password.
 * @returns {object} The authenticated user.
 * @throws {Error} If credentials are invalid.
 */
export const authenticate = async (email, password) => {
  const user = await findByEmail(email)

  // Process dummy hash to prevent timing attacks.
  if (!user) {
    await bcrypt.compare(password, DUMMY_HASH)
    const error = new Error('Invalid credentials.')
    error.status = 401
    throw error
  }

  if (!(await bcrypt.compare(password, user.password_hash))) {
    const error = new Error('Invalid credentials.')
    error.status = 401
    throw error
  }

  return { id: user.id, email: user.email, display_name: user.display_name, created_at: user.created_at }
}
