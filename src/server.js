/**
 * @file Starts the HTTP server.
 * @module src/server
 * @author Hans Nilsson
 * @version 0.1.0
 */

import app from './app.js'

const port = process.env.PORT || 3000

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`)
})
