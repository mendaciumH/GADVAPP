import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddModeReglementToFactures1766008100000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.addColumn(
            'factures',
            new TableColumn({
                name: 'mode_reglement',
                type: 'enum',
                enum: ['espèce', 'chèque'],
                isNullable: true,
            }),
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropColumn('factures', 'mode_reglement');
    }
}
