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

// Map HTTP verbs and route paths to controller actions.

// Create favorite movies for a user.
router.post('/favorites', authenticateJWT, (req, res, next) => controller.saveFavorites(req, res, next))

// Create a favorite movie for a user.
router.post('/favorite', authenticateJWT, (req, res, next) => controller.addFavorite(req, res, next))

// Get a user's favorite movies.
router.get('/favorites', authenticateJWT, (req, res, next) => controller.getFavorites(req, res, next))

// Delete a user's favorite movie.
router.delete('/favorites/:movieId', authenticateJWT, (req, res, next) => controller.deleteFavorite(req, res, next))

// Get a user's profile info.
router.get('/profile', authenticateJWT, (req, res, next) => controller.getProfile(req, res, next))

// Get a user's stats (swipes and saves).
router.get('/stats', authenticateJWT, (req, res, next) => controller.getStats(req, res, next))
