/**
 * @file Defines the interaction model for user-movie interactions.
 * @module models/interactionModel
 * @author Hans Nilsson
 * @version 0.1.0
 */

import pool from '../config/db.js'

/**
 * Creates a new user-movie interaction (save, skip, etc.).
 * Links the user ID to the movie ID along with the user's action, preventing duplicate interactions.
 * If the user interacts in another way with the same movie, change the interaction.
 * @param {object} interaction - The interaction to create.
 */
export const createInteraction = async (interaction) => {
  await pool.query(
    'INSERT INTO movie_interactions (movie_id, user_id, interaction) VALUES ($1, $2, $3) ON CONFLICT (user_id, movie_id) DO UPDATE SET interaction = EXCLUDED.interaction',
    [interaction.movie_id, interaction.user_id, interaction.interaction]
  )
}
