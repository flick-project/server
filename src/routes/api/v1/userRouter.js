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

router.get('/profile', authenticateJWT, (req, res, next) => controller.profile(req, res, next))

router.get('/stats', authenticateJWT, (req, res, next) => controller.stats(req, res, next))

router.delete('/', authenticateJWT, (req, res, next) => controller.delete(req, res, next))

router.post('/favorites', authenticateJWT, (req, res, next) => controller.saveFavorites(req, res, next))

router.post('/favorite', authenticateJWT, (req, res, next) => controller.addFavorite(req, res, next))

router.get('/favorites', authenticateJWT, (req, res, next) => controller.getFavorites(req, res, next))

router.delete('/favorites/:movieId', authenticateJWT, (req, res, next) => controller.deleteFavorite(req, res, next))
