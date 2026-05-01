/**
 * @file Configures the Express application.
 * @module src/app
 * @author Hans Nilsson
 * @version 0.1.0
 */

import cors from 'cors'
import express from 'express'
import rateLimit from 'express-rate-limit'
import helmet from 'helmet'
import { router } from './routes/router.js'

// Create an Express application.
const app = express()

// Set various HTTP headers to make the application little more secure (https://www.npmjs.com/package/helmet).
app.use(helmet())

// Enable Cross Origin Resource Sharing (CORS) (https://www.npmjs.com/package/cors).
app.use(cors())

// Limit to 100 requests per 15 minutes, returns 429 when exceeded.
app.use(rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 100,
  standardHeaders: 'draft-7',
  legacyHeaders: false
}))

// Parse requests of the content type application/json.
app.use(express.json())

// Register routes.
app.use('/', router)

// Error handler.
app.use((err, req, res, next) => {
  const status = err.status || 500

  if (process.env.NODE_ENV === 'production') {
    // Ensure a valid status code is set for the error.
    // If the status code is not provided, default to 500 (Internal Server Error).
    // This prevents leakage of sensitive error details to the client.
    res.status(status).json({
      status,
      message: status === 500 ? 'Internal Server Error' : err.message
    })
    return
  }

  // Send only the error message and status code to prevent leakage of
  // sensitive information.
  res.status(status).json({
    status,
    message: err.message,
    stack: err.stack
  })
})

export default app
