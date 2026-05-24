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
    skipped: 0,
    removed: 0,
    dislike: -2,
    hate: -4
  },
  genreLimit: 5,
  negativeKeywordLimit: 20
}
