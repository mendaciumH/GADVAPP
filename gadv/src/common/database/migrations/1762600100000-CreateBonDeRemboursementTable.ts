import { MigrationInterface, QueryRunner, Table, TableForeignKey } from 'typeorm';

export class CreateBonDeRemboursementTable1762600100000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.createTable(
            new Table({
                name: 'bon_de_remboursement',
                columns: [
                    {
                        name: 'id',
                        type: 'bigserial',
                        isPrimary: true,
                    },
                    {
                        name: 'numero',
                        type: 'varchar',
                        length: '50',
                        isUnique: true,
                        isNullable: false,
                    },
                    {
                        name: 'client_id',
                        type: 'bigint',
                        isNullable: false,
                    },
                    {
                        name: 'commande_id',
                        type: 'bigint',
                        isNullable: false,
                    },
                    {
                        name: 'montant',
                        type: 'decimal',
                        precision: 10,
                        scale: 2,
                        isNullable: false,
                    },
                    {
                        name: 'date_remboursement',
                        type: 'timestamptz',
                        default: 'CURRENT_TIMESTAMP',
                    },
                    {
                        name: 'motif',
                        type: 'text',
                        isNullable: true,
                    },
                    {
                        name: 'created_at',
                        type: 'timestamptz',
                        default: 'CURRENT_TIMESTAMP',
                    },
                    {
                        name: 'updated_at',
                        type: 'timestamptz',
                        default: 'CURRENT_TIMESTAMP',
                    },
                ],
            }),
            true,
        );

        const table = await queryRunner.getTable('bon_de_remboursement');
        if (!table) {
            return;
        }
        const foreignKeyClient = table.foreignKeys.find(fk => fk.columnNames.indexOf('client_id') !== -1);
        const foreignKeyCommande = table.foreignKeys.find(fk => fk.columnNames.indexOf('commande_id') !== -1);

        // Add foreign key for client_id if not exists
        if (!foreignKeyClient) {
            await queryRunner.createForeignKey(
                'bon_de_remboursement',
                new TableForeignKey({
                    columnNames: ['client_id'],
                    referencedColumnNames: ['id'],
                    referencedTableName: 'clients',
                    onDelete: 'CASCADE',
                }),
            );
        }

        // Add foreign key for commande_id if not exists
        if (!foreignKeyCommande) {
            await queryRunner.createForeignKey(
                'bon_de_remboursement',
                new TableForeignKey({
                    columnNames: ['commande_id'],
                    referencedColumnNames: ['id'],
                    referencedTableName: 'commandes',
                    onDelete: 'CASCADE',
                }),
            );
        }

        // Create index on client_id
        await queryRunner.query(
            `CREATE INDEX IF NOT EXISTS "idx_bon_de_remboursement_client_id" ON "bon_de_remboursement" ("client_id")`,
        );

        // Create index on commande_id
        await queryRunner.query(
            `CREATE INDEX IF NOT EXISTS "idx_bon_de_remboursement_commande_id" ON "bon_de_remboursement" ("commande_id")`,
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropTable('bon_de_remboursement');
    }
}
