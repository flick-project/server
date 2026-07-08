/**
 * @file Defines the movie router.
 * @module routes/movieRouter
 * @author Hans Nilsson
 */
import express from 'express'
import { MovieController } from '../../../controllers/api/MovieController.js'
import { optionalAuth } from '../../../middleware/optionalAuth.js'

export const router = express.Router()
const controller = new MovieController()

// Map HTTP verbs and route paths to controller actions.
router.get('/discover', optionalAuth, controller.discover.bind(controller))
router.get('/search', controller.search.bind(controller))
router.get('/:tmdbId', optionalAuth, controller.find.bind(controller))
