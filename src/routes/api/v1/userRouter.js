/**
 * @file Defines the user router.
 * @module routes/userRouter
 * @author Hans Nilsson
 */
import express from 'express'
import { UserController } from '../../../controllers/api/UserController.js'
import { authenticateJWT } from '../../../middleware/auth.js'

export const router = express.Router()
const controller = new UserController()

router.use(authenticateJWT)

router.get('/profile', controller.profile.bind(controller))
router.get('/stats', controller.stats.bind(controller))
router.delete('/account', controller.remove.bind(controller))
