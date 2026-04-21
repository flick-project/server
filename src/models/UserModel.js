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
 * @param {string} password - The user's password.
 * @throws {Error} If validation fails.
 */
const validate = (email, password) => {
  if (!email || !password) {
    const error = new Error('Email and password are required.')
    error.status = 400
    throw error
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
 * @param {string} password - The user's plain text password.
 * @returns {object} The created user row.
 */
export const createUser = async (email, password) => {
  validate(email, password)

  const hashedPassword = await bcrypt.hash(password, 10)
  const result = await pool.query(
    'INSERT INTO users (email, password) VALUES ($1, $2) RETURNING id, email, created_at',
    [email, hashedPassword]
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

  if (!(await bcrypt.compare(password, user.password))) {
    const error = new Error('Invalid credentials.')
    error.status = 401
    throw error
  }

  return { id: user.id, email: user.email, created_at: user.created_at }
}
