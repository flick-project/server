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

// Map HTTP verbs and route paths to controller actions.
router.post('/', authenticateJWT, (req, res, next) => controller.rate(req, res, next))
router.delete('/:movieId', authenticateJWT, (req, res, next) => controller.delete(req, res, next))
