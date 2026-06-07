/**
 * @file Defines the interaction router.
 * @module routes/interactionRouter
 * @author Hans Nilsson
 */
import express from 'express'
import { InteractionController } from '../../../controllers/api/InteractionController.js'
import { authenticateJWT } from '../../../middleware/auth.js'

export const router = express.Router()
const controller = new InteractionController()

router.use(authenticateJWT)

// Map HTTP verbs and route paths to controller actions.
router.post('/', controller.create.bind(controller))
