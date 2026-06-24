/**
 * @file Configuration for the recommendation algorithm.
 * @module config/recommendation
 */
export const recommendation = {
  weights: {
    favorite: 6,
    love: 4,
    like: 2,
    saved: 1,
    removed: 0,
    skipped: 0,
    dismissed: -2,
    dislike: -2,
    hate: -4
  },
  genreLimit: 5,
  excludedGenres: ['18'],
  negativeKeywordLimit: 20
}
