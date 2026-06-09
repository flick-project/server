/**
 * @file Defines the image router.
 * @module routes/imageRouter
 * @author Hans Nilsson
 */
import express from 'express'
import { ImageController } from '../../../controllers/api/ImageController.js'

export const router = express.Router()
const controller = new ImageController()

router.get('/posters/:id', controller.poster.bind(controller))
