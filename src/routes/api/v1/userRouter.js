/**
 * @file Defines the user router.
 * @module routes/userRouter
 * @author Hans Nilsson
 * @version 0.1.0
 */

import express from 'express'
import { UserController } from '../../../controllers/api/UserController.js'
import { authenticateJWT } from '../../../middleware/auth.js'

export const router = express.Router()

const controller = new UserController()

// Map HTTP verbs and route paths to controller actions.

// Create favorite movies for a user.
router.post('/favorites', authenticateJWT, (req, res, next) => controller.saveFavorites(req, res, next))

// Get a user's favorite movies.
router.get('/favorites', authenticateJWT, (req, res, next) => controller.getFavorites(req, res, next))
