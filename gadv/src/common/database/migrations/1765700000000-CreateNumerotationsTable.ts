import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm';

export class CreateNumerotationsTable1765700000000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.createTable(
            new Table({
                name: 'numerotations',
                columns: [
                    {
                        name: 'id',
                        type: 'int',
                        isPrimary: true,
                        isGenerated: true,
                        generationStrategy: 'increment',
                    },
                    {
                        name: 'type',
                        type: 'varchar', // Postgres supports enum but varchar is more portable for migrations
                        isUnique: true,
                    },
                    {
                        name: 'prefix',
                        type: 'varchar',
                        length: '10',
                    },
                    {
                        name: 'format',
                        type: 'varchar',
                        length: '50',
                        default: "'{PREFIX}-{YYYY}{MM}-{SEQ}'",
                    },
                    {
                        name: 'counter',
                        type: 'int',
                        default: 0,
                    },
                    {
                        name: 'reset_interval',
                        type: 'varchar',
                        length: '20',
                        default: "'MONTHLY'",
                    },
                    {
                        name: 'last_reset',
                        type: 'date',
                        isNullable: true,
                    },
                    {
                        name: 'created_at',
                        type: 'timestamp',
                        default: 'CURRENT_TIMESTAMP',
                    },
                    {
                        name: 'updated_at',
                        type: 'timestamp',
                        default: 'CURRENT_TIMESTAMP',
                    },
                ],
            }),
            true,
        );

        // Insert default values
        await queryRunner.query(`
      INSERT INTO numerotations (type, prefix, format, counter, reset_interval, last_reset)
      VALUES 
      ('FACTURE', 'FACT', '{PREFIX}-{YYYY}{MM}-{SEQ}', 0, 'MONTHLY', CURRENT_DATE),
      ('BON_VERSEMENT', 'BV', '{PREFIX}-{YYYY}{MM}-{SEQ}', 0, 'MONTHLY', CURRENT_DATE)
    `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropTable('numerotations');
    }
}
