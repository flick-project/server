/**
 * @file Defines the rating router.
 * @module routes/ratingRouter
 * @author Hans Nilsson
 */
import express from 'express'
import { RatingController } from '../../../controllers/api/RatingController.js'
import { authenticateJWT } from '../../../middleware/auth.js'

export const router = express.Router()
const controller = new RatingController()

router.use(authenticateJWT)

router.post('/', controller.rate.bind(controller))
router.delete('/:movieId', controller.remove.bind(controller))
