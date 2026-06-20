/**
 * @file API version 1 router.
 * @module routes/router
 * @author Hans Nilsson
 */

import express from 'express'
import { router as authRouter } from './authRouter.js'
import { router as userRouter } from './userRouter.js'
import { router as movieRouter } from './movieRouter.js'
import { router as watchlistRouter } from './watchlistRouter.js'
import { router as interactionRouter } from './interactionRouter.js'
import { router as favoriteRouter } from './favoriteRouter.js'
import { router as ratingRouter } from './ratingRouter.js'
import { router as imageRouter } from './imageRouter.js'

export const router = express.Router()

router.get('/', (req, res) => res.json({ message: 'Welcome to version 1 of Flick\'s RESTful API!' }))

router.use('/auth', authRouter)
router.use('/user', userRouter)
router.use('/movies', movieRouter)
router.use('/watchlist', watchlistRouter)
router.use('/interactions', interactionRouter)
router.use('/favorites', favoriteRouter)
router.use('/ratings', ratingRouter)
router.use('/images', imageRouter)

// Test rate limiter.
router.get('/test/rate-limit', (req, res) => {
  res.status(200).json({ message: 'OK' })
})
