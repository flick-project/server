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
const VALID_WIDTHS = [92, 154, 185, 300, 500, 780]

const inFlight = new Map()

// Local path for a cached WebP.
const getPath = (posterPath, width) => {
  const safe = posterPath.replace(/^\//, '').replace(/\//g, '_')
  return `${POSTERS_DIR}/${safe}_${width}.webp`
}

const fetchBuffer = async (posterPath, width) => {
  const url = `https://image.tmdb.org/t/p/w${width}${posterPath}`
  const res = await fetch(url)
  if (!res.ok) throw new Error(`TMDB ${res.status}`)
  return Buffer.from(await res.arrayBuffer())
}

const saveAsWebp = async (buffer, filePath) => {
  try {
    const temp = `${filePath}.tmp`
    await sharp(buffer).webp({ quality: 75 }).toFile(temp)
    await fs.rename(temp, filePath)
    console.log(`Saved WebP: ${filePath}`)
  } catch (error) {
    console.error(`Failed to save WebP: ${filePath}`, error)
  }
}

export const getPosterStream = async (posterPath, width) => {
  width = VALID_WIDTHS.includes(width) ? width : 300
  const filePath = getPath(posterPath, width)

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

  // First request? Fetch from TMDB once.
  const buffer = await fetchBuffer(posterPath, width)
  const conversion = saveAsWebp(buffer, filePath)
  inFlight.set(filePath, conversion)
  conversion.finally(() => inFlight.delete(filePath))

  return { stream: Readable.from(buffer), contentType: 'image/jpeg' }
}
