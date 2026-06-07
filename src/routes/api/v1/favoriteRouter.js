/**
 * @file Defines the favorite router.
 * @module routes/favoriteRouter
 * @author Hans Nilsson
 */
import express from 'express'
import { FavoriteController } from '../../../controllers/api/FavoriteController.js'
import { authenticateJWT } from '../../../middleware/auth.js'

export const router = express.Router()
const controller = new FavoriteController()

router.use(authenticateJWT)

// Map HTTP verbs and route paths to controller actions.
router.get('/', controller.getAll.bind(controller))
router.post('/', controller.create.bind(controller))
router.post('/batch', controller.createMany.bind(controller))
router.delete('/:movieId', controller.remove.bind(controller))
