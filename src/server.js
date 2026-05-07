/**
 * @file Starts the HTTP server.
 * @module src/server
 * @author Hans Nilsson
 * @version 0.1.0
 */

import app from './app.js'

const port = process.env.PORT || 3000

const server = app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`)
})

process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully...')
  server.close(() => process.exit(0))
})
