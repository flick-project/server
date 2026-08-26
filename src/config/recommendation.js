/**
 * @file Configuration for the recommendation algorithm.
 * @module config/recommendation
 */

export const recommendation = {
  // Signal weights by interaction/rating type.
  weights: {
    favorite: 8,
    love: 4,
    like: 2,
    saved: 1,
    neutral: 0,
    skipped: 0,
    dismissed: -4,
    dislike: -2,
    hate: -4
  },

  // Recent interactions within this window are scored at full weight.
  recentWindow: 100,

  // Ratings are split into buckets of this size, ordered most recent first.
  ratingBucketSize: 100,
  ratingDecayBase: 1.1,

  // Discovery filters.
  genreLimit: 5,
  keywordLimit: 10,

  // Keywords need this many distinct movies before they affect scoring.
  keywordMinMovies: 2,
  keywordDisplayMinMovies: 3,

  // Pool filter: movies with a net keyword score below this are excluded.
  keywordScoreThreshold: -4,

  // Minimum signal count before keyword thresholds kick in.
  thresholdKicksInAt: 100,

  // Genres excluded from scoring entirely. Drama (18) appears on nearly
  // everything, so it adds noise without useful signal.
  genreBlocklist: [18],

  // Keywords excluded from scoring entirely.
  keywordBlocklist: [
    242,      // new york city
    168346,   // manhattan, new york city
    387,      // california
    1556,     // texas
    212,      // london, england
    90,       // paris, france
    588,      // rome, italy
    1245,     // illinois
    179430,   // aftercreditsstinger
    179431,   // duringcreditsstinger
    9663,     // sequel
    818,      // based on novel or book
    9672      // based on true story
  ]
}
