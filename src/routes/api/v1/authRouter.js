/**
 * @file Defines the authentication router.
 * @module routes/accountRouter
 * @author Hans Nilsson
 * @version 0.1.0
 */

import express from 'express'
import { AuthController } from '../../../controllers/api/AuthController.js'

export const router = express.Router()

const controller = new AuthController()

// Map HTTP verbs and route paths to controller actions.

// Log in
router.post('/login', (req, res, next) => controller.login(req, res, next))

// Register
router.post('/register', (req, res, next) => controller.register(req, res, next))
