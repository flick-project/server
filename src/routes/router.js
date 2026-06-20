/**
 * @file Defines the main router.
 * @module routes/router
 * @author Hans Nilsson
 */

import express from 'express'
import http from 'node:http'
import { router as v1Router } from './api/v1/router.js'

export const router = express.Router()

router.use('/api/v1', v1Router)

// Catch 404 (ALWAYS keep this as the last route).
router.use('*path', (req, res, next) => {
  const statusCode = 404
  const error = new Error(http.STATUS_CODES[statusCode])
  error.status = statusCode

  next(error)
})
