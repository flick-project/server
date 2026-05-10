/**
 * @file Defines the movie router.
 * @module routes/movieRouter
 * @author Hans Nilsson
 * @version 0.1.0
 */

import express from 'express'
import { MovieController } from '../../../controllers/api/MovieController.js'
import { authenticateJWT } from '../../../middleware/auth.js'
import { optionalAuth } from '../../../middleware/optionalAuth.js'

export const router = express.Router()

const controller = new MovieController()

// Map HTTP verbs and route paths to controller actions.

// Get popular movies from TMDB discover.
router.get('/discover', optionalAuth, (req, res, next) => controller.discover(req, res, next))

// Search for movies by title.
router.get('/search', (req, res, next) => controller.search(req, res, next))

// Create movie-user interaction.
router.post('/interact', authenticateJWT, (req, res, next) => controller.interact(req, res, next))
