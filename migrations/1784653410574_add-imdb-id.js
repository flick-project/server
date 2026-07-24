/**
 * @param {import('node-pg-migrate').MigrationBuilder} pgm - The migration builder.
 */
export async function up (pgm) {
  pgm.sql('ALTER TABLE movies ADD COLUMN imdb_id VARCHAR(20)')
  pgm.sql('CREATE INDEX idx_movies_imdb_id ON movies(imdb_id)')
}

/**
 * @param {import('node-pg-migrate').MigrationBuilder} pgm - The migration builder.
 */
export async function down (pgm) {
  pgm.sql('DROP INDEX IF EXISTS idx_movies_imdb_id')
  pgm.sql('ALTER TABLE movies DROP COLUMN IF EXISTS imdb_id')
}
