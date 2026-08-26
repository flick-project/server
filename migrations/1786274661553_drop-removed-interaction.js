/**
 * @param {import('node-pg-migrate').MigrationBuilder} pgm - The migration builder.
 */
export async function up (pgm) {
  pgm.sql(`
    -- Unsaving is now a real delete; no more tombstone rows.
    DELETE FROM movie_interactions WHERE interaction = 'removed';

    ALTER TABLE movie_interactions
    DROP CONSTRAINT movie_interactions_interaction_check;

    ALTER TABLE movie_interactions
    ADD CONSTRAINT movie_interactions_interaction_check
    CHECK (interaction IN ('saved', 'skipped', 'dismissed'));
  `)
}

/**
 * @param {import('node-pg-migrate').MigrationBuilder} pgm - The migration builder.
 */
export async function down (pgm) {
  pgm.sql(`
    ALTER TABLE movie_interactions
    DROP CONSTRAINT movie_interactions_interaction_check;

    ALTER TABLE movie_interactions
    ADD CONSTRAINT movie_interactions_interaction_check
    CHECK (interaction IN ('saved', 'skipped', 'dismissed', 'removed'));
  `)
}
