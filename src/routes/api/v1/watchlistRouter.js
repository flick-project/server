/**
 * @file Defines the watchlist router.
 * @module routes/watchlistRouter
 * @author Hans Nilsson
 */
import express from 'express'
import { WatchlistController } from '../../../controllers/api/WatchlistController.js'
import { authenticateJWT } from '../../../middleware/auth.js'

export const router = express.Router()
const controller = new WatchlistController()

router.use(authenticateJWT)

router.get('/', controller.getAll.bind(controller))
router.delete('/:movieId', controller.remove.bind(controller))
