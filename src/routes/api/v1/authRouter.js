/**
 * @file Defines the authentication router.
 * @module routes/accountRouter
 * @author Hans Nilsson
 */

import express from 'express'
import { AuthController } from '../../../controllers/api/AuthController.js'

export const router = express.Router()

const controller = new AuthController()

// Map HTTP verbs and route paths to controller actions.
router.post('/register', (req, res, next) => controller.register(req, res, next))
router.post('/login', (req, res, next) => controller.login(req, res, next))
router.post('/refresh', (req, res, next) => controller.refresh(req, res, next))
router.post('/logout', (req, res, next) => controller.logout(req, res, next))
