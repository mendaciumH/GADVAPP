import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateSessionsTable1765300000000 implements MigrationInterface {
  name = 'CreateSessionsTable1765300000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create sessions table
    await queryRunner.query(`
      CREATE TABLE "sessions" (
        "id" BIGSERIAL NOT NULL,
        "article_id" BIGINT NOT NULL,
        "date" DATE NOT NULL,
        "nombre_place" INTEGER NOT NULL,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "sessions_pkey" PRIMARY KEY ("id"),
        CONSTRAINT "sessions_article_id_fkey" FOREIGN KEY ("article_id") 
          REFERENCES "articles"("id") ON DELETE CASCADE
      )
    `);

    // Create index on article_id for better query performance
    await queryRunner.query(`
      CREATE INDEX "idx_sessions_article_id" ON "sessions"("article_id")
    `);

    // Create index on date for filtering
    await queryRunner.query(`
      CREATE INDEX "idx_sessions_date" ON "sessions"("date")
    `);

    // Add foreign key constraint for session_id (column already exists from CreateCommandesTable)
    await queryRunner.query(`
      ALTER TABLE "commandes" 
      ADD CONSTRAINT "commandes_session_id_fkey" 
      FOREIGN KEY ("session_id") 
      REFERENCES "sessions"("id") ON DELETE SET NULL
    `);

    // Create index on session_id for better query performance
    await queryRunner.query(`
      CREATE INDEX "idx_commandes_session_id" ON "commandes"("session_id")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop indexes
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_commandes_session_id"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_sessions_date"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_sessions_article_id"`);

    // Drop foreign key constraint
    await queryRunner.query(`
      ALTER TABLE "commandes" 
      DROP CONSTRAINT IF EXISTS "commandes_session_id_fkey"
    `);

    // Drop sessions table
    await queryRunner.query(`DROP TABLE IF EXISTS "sessions"`);
  }
}

