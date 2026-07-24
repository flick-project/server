/**
 * @file Defines the import router.
 * @module routes/importRouter
 * @author Hans Nilsson
 */
import express from 'express'
import { ImportController } from '../../../controllers/api/ImportController.js'
import { authenticateJWT } from '../../../middleware/auth.js'

export const router = express.Router()
const controller = new ImportController()

router.use(authenticateJWT)

// Map HTTP verbs and route paths to controller actions.
router.post('/ratings', controller.import.bind(controller))
