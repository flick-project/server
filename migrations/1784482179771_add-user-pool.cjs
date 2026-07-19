/**
 * @type {import('node-pg-migrate').ColumnDefinitions | undefined}
 */
exports.shorthands = undefined

/**
 * @param {import('node-pg-migrate').MigrationBuilder} pgm - The migration builder.
 * @returns {Promise<void> | void} Nothing.
 */
exports.up = (pgm) => {
  pgm.sql(`
    CREATE TABLE user_pool (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      movie_id INTEGER NOT NULL REFERENCES movies(tmdb_id) ON DELETE CASCADE,
      source VARCHAR(20) NOT NULL CHECK (source IN ('discover', 'enriched')),
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      UNIQUE (user_id, movie_id)
    );

    CREATE INDEX idx_user_pool_user_id ON user_pool(user_id);
    CREATE INDEX idx_user_pool_source ON user_pool(user_id, source);
  `)
}

/**
 * @param {import('node-pg-migrate').MigrationBuilder} pgm - The migration builder.
 * @returns {Promise<void> | void} Nothing.
 */
exports.down = (pgm) => {
  pgm.sql('DROP TABLE IF EXISTS user_pool CASCADE;')
}
