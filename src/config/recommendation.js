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
  negativeKeywordLimit: 20,
  interactionWindow: 200,
  ratingWindow: 100,
  keywordDistinctThreshold: 2,
  thresholdKicksInAt: 100,
  // Geographic and generic keywords that add noise to taste profiles.
  keywordBlocklist: [
  // Cities and regions
    242,    // new york city
    168346, // manhattan, new york city
    387,    // california
    1556,   // texas
    212,    // london, england
    90,     // paris, france
    588,    // rome, italy

    // Countries
    534,    // mexico

    // Noise
    179430, // aftercreditsstinger
    179431,  // duringcreditsstinger
    9663 // sequel
  ]
}
