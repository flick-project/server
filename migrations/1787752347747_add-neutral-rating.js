/**
 * @param {import('node-pg-migrate').MigrationBuilder} pgm - The migration builder.
 */
export async function up (pgm) {
  pgm.sql(`
    ALTER TABLE ratings
    DROP CONSTRAINT ratings_rating_check;
    ALTER TABLE ratings
    ADD CONSTRAINT ratings_rating_check
    CHECK (rating IN ('hate', 'dislike', 'neutral', 'like', 'love'));
  `)
}

/**
 * @param {import('node-pg-migrate').MigrationBuilder} pgm - The migration builder.
 */
export async function down (pgm) {
  pgm.sql(`
    DELETE FROM ratings WHERE rating = 'neutral';
    ALTER TABLE ratings
    DROP CONSTRAINT ratings_rating_check;
    ALTER TABLE ratings
    ADD CONSTRAINT ratings_rating_check
    CHECK (rating IN ('hate', 'dislike', 'like', 'love'));
  `)
}
