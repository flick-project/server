/**
 * @file Defines the recommendation pool.
 * @module services/pool/pool.js
 * @author Hans Nilsson
 */

import { create, findUndiscovered, findRandomUndiscovered } from '../../models/movieModel.js'
import { findUserPreferences } from '../../models/recommendationModel.js'
import { recommendation } from '../../config/recommendation.js'

export const addToPool = async (userId, items) => {
  const filtered = await filterItems(userId, items)
  for (const item of filtered) {
    await create(itemToMovie(item))
  }
}

export const servePool = async (userId, count = 20) => {
  const randomCount = Math.floor(count * 0.2)
  const baseCount = count - randomCount

  const [base, random] = await Promise.all([
    findUndiscovered(userId, baseCount),
    findRandomUndiscovered(userId, randomCount)
  ])

  return shuffle([...base, ...random])
}

const shuffle = (arr) => arr.sort(() => Math.random() - 0.5)

const filterItems = async (userId, items) => {
  const scores = await findUserPreferences(userId)
  const negativeKeywords = new Set(
    Object.entries(scores.keywords)
      .filter(([, score]) => score < 0)
      .sort((a, b) => a[1] - b[1])
      .slice(0, recommendation.negativeKeywordLimit)
      .map(([id]) => Number(id))
  )

  return items.filter(item => {
    return !item.tags.some(t => negativeKeywords.has(t.id))
  })
}

const itemToMovie = (item) => ({
  id: item.id,
  title: item.title,
  poster_path: item.image,
  release_date: item.year,
  vote_average: item.score,
  vote_count: item.votes,
  overview: item.overview,
  genre_ids: item.genres
})
