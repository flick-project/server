/**
 * @file Defines the watched router.
 * @module routes/watchedRouter
 * @author Hans Nilsson
 */
import express from 'express'
import { WatchedController } from '../../../controllers/api/WatchedController.js'
import { authenticateJWT } from '../../../middleware/auth.js'

export const router = express.Router()
const controller = new WatchedController()

router.use(authenticateJWT)

// Map HTTP verbs and route paths to controller actions.
// Batch routes come before /:movieId to avoid "batch" being captured as a param.
router.get('/', controller.getAll.bind(controller))
router.post('/', controller.create.bind(controller))
router.post('/batch', controller.createMany.bind(controller))
router.delete('/batch', controller.removeMany.bind(controller))
router.delete('/:movieId', controller.remove.bind(controller))
