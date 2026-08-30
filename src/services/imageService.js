/**
 * @file Image service for fetching, converting, and storing images at different resolutions.
 * @module services/imageService
 * @author Hans Nilsson
 */

import fs from 'fs/promises'
import { createReadStream } from 'fs'
import { Readable } from 'stream'
import sharp from 'sharp'

const POSTERS_DIR = process.env.POSTER_DIR || './posters'
const BACKDROPS_DIR = process.env.BACKDROP_DIR || './backdrops'

const POSTER_WIDTHS = [92, 154, 185, 300, 500, 780]
const BACKDROP_WIDTHS = [300, 780, 1280]

const inFlight = new Map()

// Ensure directories exist at startup.
await fs.mkdir(POSTERS_DIR, { recursive: true })
await fs.mkdir(BACKDROPS_DIR, { recursive: true })

/**
 * Validate a TMDB image path to prevent path traversal.
 * @param {string} imagePath - The image path from TMDB (e.g. /abc123.jpg).
 * @returns {boolean} True if the path is valid.
 */
const isValidPath = (imagePath) => /^\/[a-zA-Z0-9]+\.(jpg|png)$/.test(imagePath)

/**
 * Fetch an image buffer from TMDB at the given width.
 * @param {string} imagePath - The image path from TMDB.
 * @param {number} width - The image width.
 * @returns {Promise<Buffer>} The image buffer.
 */
const fetchBuffer = async (imagePath, width) => {
  const url = `https://image.tmdb.org/t/p/w${width}${imagePath}`
  const res = await fetch(url)
  if (!res.ok) throw new Error(`TMDB ${res.status}`)
  return Buffer.from(await res.arrayBuffer())
}

/**
 * Get a stream for a TMDB image, cached as WebP on disk.
 * @param {object} options - Options object.
 * @param {string} options.dir - The cache directory.
 * @param {number[]} options.validWidths - Allowed widths.
 * @param {number} options.defaultWidth - Fallback width if invalid.
 * @param {string} options.imagePath - The image path from TMDB.
 * @param {number} options.width - The requested width.
 * @returns {Promise<{stream: Readable, contentType: string}>} The stream and content type.
 */
const getImageStream = async ({ dir, validWidths, defaultWidth, imagePath, width }) => {
  if (!isValidPath(imagePath)) throw new Error('Invalid image path')

  width = validWidths.includes(width) ? width : defaultWidth
  const safe = imagePath.replace(/^\//, '')
  const filePath = `${dir}/${safe}_${width}.webp`

  // Cached? Serve WebP directly.
  try {
    await fs.access(filePath)
    return { stream: createReadStream(filePath), contentType: 'image/webp' }
  } catch {}

  // Already being fetched? Wait for conversion, then serve WebP.
  if (inFlight.has(filePath)) {
    await inFlight.get(filePath)
    return { stream: createReadStream(filePath), contentType: 'image/webp' }
  }

  // First request? Fetch from TMDB, convert once, serve WebP.
  const buffer = await fetchBuffer(imagePath, width)
  const webpBuffer = await sharp(buffer).webp({ quality: 75 }).toBuffer()

  // Persist to disk in the background so subsequent requests are cache hits.
  const conversion = fs.writeFile(filePath, webpBuffer).catch(err => {
    console.error(`Failed to save WebP: ${filePath}`, err)
  })
  inFlight.set(filePath, conversion)
  conversion.finally(() => inFlight.delete(filePath))

  return { stream: Readable.from(webpBuffer), contentType: 'image/webp' }
}

/**
 * Get a stream for a TMDB poster image.
 * @param {string} posterPath - The poster path from TMDB.
 * @param {number} width - The requested width.
 * @returns {Promise<{stream: Readable, contentType: string}>} The stream and content type.
 */
export const getPosterStream = (posterPath, width) =>
  getImageStream({ dir: POSTERS_DIR, validWidths: POSTER_WIDTHS, defaultWidth: 300, imagePath: posterPath, width })

/**
 * Get a stream for a TMDB backdrop image.
 * @param {string} backdropPath - The backdrop path from TMDB.
 * @param {number} width - The requested width.
 * @returns {Promise<{stream: Readable, contentType: string}>} The stream and content type.
 */
export const getBackdropStream = (backdropPath, width) =>
  getImageStream({ dir: BACKDROPS_DIR, validWidths: BACKDROP_WIDTHS, defaultWidth: 780, imagePath: backdropPath, width })
