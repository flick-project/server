/**
 * @file API version 1 router.
 * @module routes/router
 * @author Hans Nilsson
 * @version 0.1.0
 */

import express from 'express'
import { router as authRouter } from './authRouter.js'
import { router as movieRouter } from './movieRouter.js'
import { authenticateJWT } from '../../../middleware/auth.js'

export const router = express.Router()

router.get('/', (req, res) => res.json({ message: 'Welcome to version 1 of Flick\'s RESTful API!' }))

router.use('/auth', authRouter)

router.use('/movies', movieRouter)

// Test protected routes.
router.get('/user/profile', authenticateJWT, (req, res) => {
  res.json({ user: req.user })
})
