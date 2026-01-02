import { MigrationInterface, QueryRunner } from "typeorm";

export class AddTarifAdditionnelToArticleOmra1765600000000 implements MigrationInterface {
    name = 'AddTarifAdditionnelToArticleOmra1765600000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "articles_omra" ADD "tarif_additionnel" numeric(10,2)`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "articles_omra" DROP COLUMN "tarif_additionnel"`);
    }

}
