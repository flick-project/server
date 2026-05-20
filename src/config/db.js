/**
 * @file Database connection configuration.
 * @module config/db
 * @author Hans Nilsson
 */

import pg from 'pg'

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL
})

export default pool
