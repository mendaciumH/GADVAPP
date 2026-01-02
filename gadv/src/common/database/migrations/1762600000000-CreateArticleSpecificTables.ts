import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateArticleSpecificTables1762600000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create articles_omra table
    await queryRunner.query(`
      CREATE TABLE "articles_omra" (
        "article_id" bigint NOT NULL,
        "date" text[],
        "chambres" text[],
        "nom_hotel" text,
        "created_at" timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updated_at" timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "articles_omra_pkey" PRIMARY KEY ("article_id")
      )
    `);

    await queryRunner.query(`
      ALTER TABLE "articles_omra" 
      ADD CONSTRAINT "articles_omra_article_id_fkey" 
      FOREIGN KEY ("article_id") REFERENCES "articles"("id") ON DELETE CASCADE
    `);

    // Create articles_visa table
    await queryRunner.query(`
      CREATE TABLE "articles_visa" (
        "article_id" bigint NOT NULL,
        "pays_destination" text,
        "type_visa" text,
        "duree_validite" text,
        "delai_traitement" text,
        "documents_requis" text[],
        "created_at" timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updated_at" timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "articles_visa_pkey" PRIMARY KEY ("article_id")
      )
    `);

    await queryRunner.query(`
      ALTER TABLE "articles_visa" 
      ADD CONSTRAINT "articles_visa_article_id_fkey" 
      FOREIGN KEY ("article_id") REFERENCES "articles"("id") ON DELETE CASCADE
    `);

    // Create articles_voyage table
    await queryRunner.query(`
      CREATE TABLE "articles_voyage" (
        "article_id" bigint NOT NULL,
        "destination" text,
        "date_retour" timestamp with time zone,
        "duree_voyage" text,
        "type_hebergement" text,
        "transport" text,
        "programme" text[],
        "created_at" timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updated_at" timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "articles_voyage_pkey" PRIMARY KEY ("article_id")
      )
    `);

    await queryRunner.query(`
      ALTER TABLE "articles_voyage" 
      ADD CONSTRAINT "articles_voyage_article_id_fkey" 
      FOREIGN KEY ("article_id") REFERENCES "articles"("id") ON DELETE CASCADE
    `);

    // Create articles_assurance table
    await queryRunner.query(`
      CREATE TABLE "articles_assurance" (
        "article_id" bigint NOT NULL,
        "type_assurance" text,
        "duree_couverture" text,
        "zone_couverture" text,
        "montant_couverture" text,
        "franchise" text,
        "conditions_particulieres" text[],
        "created_at" timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updated_at" timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "articles_assurance_pkey" PRIMARY KEY ("article_id")
      )
    `);

    await queryRunner.query(`
      ALTER TABLE "articles_assurance" 
      ADD CONSTRAINT "articles_assurance_article_id_fkey" 
      FOREIGN KEY ("article_id") REFERENCES "articles"("id") ON DELETE CASCADE
    `);

    // Create articles_billet_avion table
    await queryRunner.query(`
      CREATE TABLE "articles_billet_avion" (
        "article_id" bigint NOT NULL,
        "aeroport_depart" text,
        "aeroport_arrivee" text,
        "date_depart_vol" timestamp with time zone,
        "date_retour_vol" timestamp with time zone,
        "compagnie_aerienne_id" bigint,
        "numero_vol" text,
        "classe_vol" text,
        "escales" text[],
        "created_at" timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updated_at" timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "articles_billet_avion_pkey" PRIMARY KEY ("article_id")
      )
    `);

    await queryRunner.query(`
      ALTER TABLE "articles_billet_avion" 
      ADD CONSTRAINT "articles_billet_avion_article_id_fkey" 
      FOREIGN KEY ("article_id") REFERENCES "articles"("id") ON DELETE CASCADE
    `);

    await queryRunner.query(`
      ALTER TABLE "articles_billet_avion" 
      ADD CONSTRAINT "articles_billet_avion_compagnie_aerienne_id_fkey" 
      FOREIGN KEY ("compagnie_aerienne_id") REFERENCES "compagnies_aeriennes"("id")
    `);

    // Create articles_reservation_hotel table
    await queryRunner.query(`
      CREATE TABLE "articles_reservation_hotel" (
        "article_id" bigint NOT NULL,
        "date_check_in" timestamp with time zone,
        "date_check_out" timestamp with time zone,
        "nombre_nuits" integer,
        "nombre_chambres" integer,
        "nombre_personnes" integer,
        "type_chambre" text,
        "services_hotel" text[],
        "adresse_hotel" text,
        "ville_hotel" text,
        "pays_hotel" text,
        "created_at" timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updated_at" timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "articles_reservation_hotel_pkey" PRIMARY KEY ("article_id")
      )
    `);

    await queryRunner.query(`
      ALTER TABLE "articles_reservation_hotel" 
      ADD CONSTRAINT "articles_reservation_hotel_article_id_fkey" 
      FOREIGN KEY ("article_id") REFERENCES "articles"("id") ON DELETE CASCADE
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "articles_reservation_hotel"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "articles_billet_avion"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "articles_assurance"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "articles_voyage"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "articles_visa"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "articles_omra"`);
  }
}

