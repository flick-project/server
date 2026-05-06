/**
 * @file Defines the watchlist router.
 * @module routes/watchlistRouter
 * @author Hans Nilsson
 * @version 0.1.0
 */

import express from 'express'
import { WatchlistController } from '../../../controllers/api/WatchlistController.js'
import { authenticateJWT } from '../../../middleware/auth.js'

export const router = express.Router()

const controller = new WatchlistController()

// Map HTTP verbs and route paths to controller actions.

// Get a user's watchlist.
router.get('/', authenticateJWT, (req, res, next) => controller.getWatchlist(req, res, next))

// Delete movie from a user's watchlist.
router.delete('/:movieId', authenticateJWT, (req, res, next) => controller.deleteFromWatchlist(req, res, next))
