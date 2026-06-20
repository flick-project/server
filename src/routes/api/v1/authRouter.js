/**
 * @file Defines the authentication router.
 * @module routes/authRouter
 * @author Hans Nilsson
 */

import express from 'express'
import rateLimit from 'express-rate-limit'
import { AuthController } from '../../../controllers/api/AuthController.js'

export const router = express.Router()
const controller = new AuthController()

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { status: 429, message: 'Too many login attempts, please try again later.' }
})

// Map HTTP verbs and route paths to controller actions.
router.post('/register', controller.register.bind(controller))
router.post('/login', loginLimiter, controller.login.bind(controller))
router.post('/refresh', controller.refresh.bind(controller))
router.post('/logout', controller.logout.bind(controller))
