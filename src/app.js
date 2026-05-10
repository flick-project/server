/**
 * @file Configures the Express application.
 * @module src/app
 * @author Hans Nilsson
 * @version 0.1.0
 */

import cookieParser from 'cookie-parser'
import cors from 'cors'
import express from 'express'
import rateLimit from 'express-rate-limit'
import helmet from 'helmet'
import { router } from './routes/router.js'

// Create an Express application.
const app = express()

// Necessary for Nginx proxy.
app.set('trust proxy', 1)

// Set various HTTP headers to make the application a little more secure.
app.use(helmet())

// Enable Cross Origin Resource Sharing (CORS).
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true
}))

// Limit to 100 requests per 15 minutes, returns 429 when exceeded.
app.use(rateLimit({
  windowMs: process.env.NODE_ENV === 'production' ? 60000 : 15 * 60 * 1000,
  limit: process.env.NODE_ENV === 'production' ? 100 : 1000,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { status: 429, message: 'Too many requests, please try again later.' }
}))

// Parse cookie header and populate req.cookies.
app.use(cookieParser())

// Parse requests of the content type application/json.
app.use(express.json())

// Register routes.
app.use('/', router)

// Error handler.
app.use((err, req, res, next) => {
  const status = err.status || 500
  console.error(err)

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

  // Full stack trace in development.
  res.status(status).json({
    status,
    message: err.message,
    stack: err.stack
  })
})

export default app
