/**
 * @param {import('node-pg-migrate').MigrationBuilder} pgm - The migration builder.
 */
export async function up (pgm) {
  pgm.sql(`
    CREATE TABLE watched (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      movie_id INTEGER NOT NULL REFERENCES movies(tmdb_id) ON DELETE CASCADE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      UNIQUE (user_id, movie_id)
    );

    CREATE INDEX idx_watched_user_id ON watched(user_id);
  `)
}

/**
 * @param {import('node-pg-migrate').MigrationBuilder} pgm - The migration builder.
 */
export async function down (pgm) {
  pgm.sql('DROP TABLE IF EXISTS watched CASCADE;')
}
