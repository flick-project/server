import { describe, it } from 'node:test'
import assert from 'node:assert'
import { buildScores } from '../../src/models/recommendationModel.js'
import { filterCandidates } from '../../src/services/recommendationService.js'

describe('buildScores', () => {
  it('should return empty scores for no rows', () => {
    const scores = buildScores([])
    assert.deepStrictEqual(scores, { genres: {}, keywords: {} })
  })

  it('should accumulate genre scores for positive interactions', () => {
    const rows = [
      { type: 'saved', genre_ids: [28], keyword_ids: [] },
      { type: 'saved', genre_ids: [28], keyword_ids: [] }
    ]
    const scores = buildScores(rows)
    assert.strictEqual(scores.genres[28], 2)
  })

  it('should not add genre score for zero-weight interactions', () => {
    const rows = [
      { type: 'skipped', genre_ids: [28], keyword_ids: [] }
    ]
    const scores = buildScores(rows)
    assert.strictEqual(scores.genres[28], undefined)
  })

  it('should accumulate keyword scores including negative weights', () => {
    const rows = [
      { type: 'love', genre_ids: [], keyword_ids: [100] },
      { type: 'hate', genre_ids: [], keyword_ids: [100] }
    ]
    const scores = buildScores(rows)
    // love = +4, hate = -4
    assert.strictEqual(scores.keywords[100], 0)
  })

  it('should weight favorite higher than saved', () => {
    const rows = [
      { type: 'favorite', genre_ids: [28], keyword_ids: [] },
      { type: 'saved', genre_ids: [28], keyword_ids: [] }
    ]
    const scores = buildScores(rows)
    // favorite = +6, saved = +1
    assert.strictEqual(scores.genres[28], 7)
  })

  it('should handle multiple genres in one row', () => {
    const rows = [
      { type: 'love', genre_ids: [28, 12], keyword_ids: [] }
    ]
    const scores = buildScores(rows)
    assert.strictEqual(scores.genres[28], 4)
    assert.strictEqual(scores.genres[12], 4)
  })

  it('should ignore unknown interaction types', () => {
    const rows = [
      { type: 'unknown', genre_ids: [28], keyword_ids: [100] }
    ]
    const scores = buildScores(rows)
    assert.deepStrictEqual(scores, { genres: {}, keywords: {} })
  })
})

describe('filterCandidates', () => {
  const candidates = [
    { id: 1, poster_path: '/a.jpg' },
    { id: 2, poster_path: '/b.jpg' },
    { id: 3, poster_path: '/c.jpg' }
  ]

  it('should return all candidates when no negative keywords', () => {
    const keywordsByMovieId = { 1: [100], 2: [200], 3: [300] }
    const negativeKeywords = new Set()
    const result = filterCandidates(candidates, keywordsByMovieId, negativeKeywords)
    assert.strictEqual(result.length, 3)
  })

  it('should filter out candidates with negative keywords', () => {
    const keywordsByMovieId = { 1: [100], 2: [999], 3: [300] }
    const negativeKeywords = new Set([999])
    const result = filterCandidates(candidates, keywordsByMovieId, negativeKeywords)
    assert.strictEqual(result.length, 2)
    assert.ok(!result.find(m => m.id === 2))
  })

  it('should return empty array when all candidates have negative keywords', () => {
    const keywordsByMovieId = { 1: [999], 2: [999], 3: [999] }
    const negativeKeywords = new Set([999])
    const result = filterCandidates(candidates, keywordsByMovieId, negativeKeywords)
    assert.strictEqual(result.length, 0)
  })

  it('should handle candidates with no keywords', () => {
    const keywordsByMovieId = { 1: [], 2: [], 3: [] }
    const negativeKeywords = new Set([999])
    const result = filterCandidates(candidates, keywordsByMovieId, negativeKeywords)
    assert.strictEqual(result.length, 3)
  })

  it('should handle missing keyword entry for a candidate', () => {
    const keywordsByMovieId = { 1: [100] }
    const negativeKeywords = new Set([999])
    const result = filterCandidates(candidates, keywordsByMovieId, negativeKeywords)
    assert.strictEqual(result.length, 3)
  })
})
