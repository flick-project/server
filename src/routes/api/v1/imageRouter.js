/**
 * @file Defines the image router.
 * @module routes/imageRouter
 * @author Hans Nilsson
 */

import express from 'express'
import { ImageController } from '../../../controllers/api/ImageController.js'

export const router = express.Router()

const controller = new ImageController()

// Map HTTP verbs and route paths to controller actions.

router.get('/poster/:id', (req, res, next) => controller.poster(req, res, next))
