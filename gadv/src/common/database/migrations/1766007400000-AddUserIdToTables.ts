import { MigrationInterface, QueryRunner, TableColumn, TableForeignKey } from "typeorm";

export class AddUserIdToTables1766007400000 implements MigrationInterface {
    name = 'AddUserIdToTables1766007400000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        const tables = [
            'articles',
            'clients',
            'fournisseurs',
            'commandes',
            'factures',
            'bon_de_versement',
            'bon_de_remboursement',
            'caisses',
            'caisse_transactions',
            'sessions',
            'reductions',
            'taxes',
            'chambres'
        ];

        for (const table of tables) {
            // Check if column exists to avoid errors on re-run or partial migrations
            const tableExists = await queryRunner.hasTable(table);
            if (tableExists) {
                const columnExists = await queryRunner.hasColumn(table, 'user_id');
                if (!columnExists) {
                    await queryRunner.addColumn(table, new TableColumn({
                        name: 'user_id',
                        type: 'bigint',
                        isNullable: true
                    }));

                    await queryRunner.createForeignKey(table, new TableForeignKey({
                        columnNames: ['user_id'],
                        referencedColumnNames: ['id'],
                        referencedTableName: 'users',
                        onDelete: 'SET NULL' // Keep history even if user is deleted, or set null
                    }));
                }
            }
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        const tables = [
            'articles',
            'clients',
            'fournisseurs',
            'commandes',
            'factures',
            'bon_de_versement',
            'bon_de_remboursement',
            'caisses',
            'caisse_transactions',
            'sessions',
            'reductions',
            'taxes',
            'chambres'
        ];

        for (const table of tables) {
            const tableExists = await queryRunner.hasTable(table);
            if (tableExists) {
                const tableRef = await queryRunner.getTable(table);
                if (tableRef) {
                    const foreignKey = tableRef.foreignKeys.find(fk => fk.columnNames.indexOf('user_id') !== -1);
                    if (foreignKey) {
                        await queryRunner.dropForeignKey(table, foreignKey);
                    }
                    await queryRunner.dropColumn(table, 'user_id');
                }
            }
        }
    }
}
