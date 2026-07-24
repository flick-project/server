/**
 * @param {import('node-pg-migrate').MigrationBuilder} pgm - The migration builder.
 */
export async function up (pgm) {
  pgm.sql('ALTER TABLE ratings ADD COLUMN processed BOOLEAN NOT NULL DEFAULT false')
}

/**
 * @param {import('node-pg-migrate').MigrationBuilder} pgm - The migration builder.
 */
export async function down (pgm) {
  pgm.sql('ALTER TABLE ratings DROP COLUMN IF EXISTS processed')
}
