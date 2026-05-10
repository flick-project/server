/**
 * @file Starts the HTTP server.
 * @module src/server
 * @author Hans Nilsson
 * @version 0.1.0
 */

import app from './app.js'
import pool from './config/db.js'

const port = process.env.PORT || 3000

const server = app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`)
})

const cleanExpiredTokens = async () => {
  try {
    await pool.query('DELETE FROM refresh_tokens WHERE expires_at < NOW()')
  } catch (error) {
    console.error('Token cleanup failed:', error.message)
  }
}

// Clean expired refresh tokens every 24h.
const cleanup = setInterval(cleanExpiredTokens, 24 * 60 * 60 * 1000)

// Also clean refresh tokens on startup.
cleanExpiredTokens()

process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully...')
  clearInterval(cleanup)
  server.close(() => process.exit(0))
})
