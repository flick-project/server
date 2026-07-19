import { describe, it } from 'node:test'
import assert from 'node:assert'
import { buildScores } from '../../src/models/recommendationModel.js'

describe('buildScores', () => {
  it('should return empty scores and counts for no rows', () => {
    const { scores, keywordCounts } = buildScores([])
    assert.deepStrictEqual(scores, { genres: {}, keywords: {}, people: {} })
    assert.deepStrictEqual(keywordCounts, {})
  })

  it('should accumulate genre scores for positive interactions', () => {
    const rows = [
      { type: 'saved', movie_id: 1, genre_ids: [28], keyword_ids: [] },
      { type: 'saved', movie_id: 2, genre_ids: [28], keyword_ids: [] }
    ]
    const { scores } = buildScores(rows)
    assert.strictEqual(scores.genres[28], 2)
  })

  it('should not add genre score for zero-weight interactions', () => {
    const rows = [
      { type: 'skipped', movie_id: 1, genre_ids: [28], keyword_ids: [] }
    ]
    const { scores } = buildScores(rows)
    assert.strictEqual(scores.genres[28], undefined)
  })

  it('should accumulate keyword scores including negative weights', () => {
    const rows = [
      { type: 'love', movie_id: 1, genre_ids: [], keyword_ids: [100] },
      { type: 'hate', movie_id: 2, genre_ids: [], keyword_ids: [100] }
    ]
    const { scores } = buildScores(rows)
    assert.strictEqual(scores.keywords[100], 0)
  })

  it('should weight favorite higher than saved', () => {
    const rows = [
      { type: 'favorite', movie_id: 1, genre_ids: [28], keyword_ids: [] },
      { type: 'saved', movie_id: 2, genre_ids: [28], keyword_ids: [] }
    ]
    const { scores } = buildScores(rows)
    assert.strictEqual(scores.genres[28], 7)
  })

  it('should handle multiple genres in one row', () => {
    const rows = [
      { type: 'love', movie_id: 1, genre_ids: [28, 12], keyword_ids: [] }
    ]
    const { scores } = buildScores(rows)
    assert.strictEqual(scores.genres[28], 4)
    assert.strictEqual(scores.genres[12], 4)
  })

  it('should ignore unknown interaction types', () => {
    const rows = [
      { type: 'unknown', movie_id: 1, genre_ids: [28], keyword_ids: [100] }
    ]
    const { scores } = buildScores(rows)
    assert.deepStrictEqual(scores, { genres: {}, keywords: {}, people: {} })
  })

  it('should accumulate people scores from credits', () => {
    const rows = [
      {
        type: 'love',
        movie_id: 1,
        genre_ids: [],
        keyword_ids: [],
        credits: [
          { id: 500, role: 'director' },
          { id: 501, role: 'cast' }
        ]
      }
    ]
    const { scores } = buildScores(rows)
    assert.strictEqual(scores.people[500], 12)
    assert.strictEqual(scores.people[501], 4)
  })

  it('should not accumulate people scores for negative interactions', () => {
    const rows = [
      {
        type: 'hate',
        movie_id: 1,
        genre_ids: [],
        keyword_ids: [],
        credits: [
          { id: 500, role: 'director' }
        ]
      }
    ]
    const { scores } = buildScores(rows)
    assert.strictEqual(scores.people[500], undefined)
  })

  it('should skip blocklisted keywords', () => {
    const rows = [
      { type: 'love', movie_id: 1, genre_ids: [], keyword_ids: [179430, 200] }
    ]
    const { scores } = buildScores(rows)
    assert.strictEqual(scores.keywords[179430], undefined)
    assert.strictEqual(scores.keywords[200], 4)
  })

  it('should track distinct movie counts per keyword', () => {
    const rows = [
      { type: 'saved', movie_id: 1, genre_ids: [], keyword_ids: [100] },
      { type: 'love', movie_id: 2, genre_ids: [], keyword_ids: [100] },
      { type: 'dismissed', movie_id: 3, genre_ids: [], keyword_ids: [100] }
    ]
    const { keywordCounts } = buildScores(rows)
    assert.strictEqual(keywordCounts[100], 3)
  })

  it('should not double-count the same movie for a keyword', () => {
    const rows = [
      { type: 'saved', movie_id: 1, genre_ids: [], keyword_ids: [100] },
      { type: 'love', movie_id: 1, genre_ids: [], keyword_ids: [100] }
    ]
    const { keywordCounts } = buildScores(rows)
    assert.strictEqual(keywordCounts[100], 1)
  })
})
