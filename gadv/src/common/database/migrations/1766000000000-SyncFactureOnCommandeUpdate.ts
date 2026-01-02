import { MigrationInterface, QueryRunner } from "typeorm";

export class SyncFactureOnCommandeUpdate1766000000000 implements MigrationInterface {
    name = 'SyncFactureOnCommandeUpdate1766000000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // 1. Drop existing index and create partial index for performance
        await queryRunner.query(`
            DROP INDEX IF EXISTS idx_factures_commande_id;
        `);

        await queryRunner.query(`
            CREATE INDEX idx_factures_commande_id 
            ON factures(commande_id) 
            WHERE statut NOT IN ('payee', 'annulee');
        `);

        // 2. Create the sync function with proper safeguards
        await queryRunner.query(`
            CREATE OR REPLACE FUNCTION update_facture_from_commande()
            RETURNS TRIGGER AS $$
            DECLARE
                v_facture_id INTEGER;
                v_facture_statut VARCHAR(50);
                v_updated_count INTEGER;
            BEGIN
                -- Early exit if prix hasn't changed
                IF OLD.prix IS NOT DISTINCT FROM NEW.prix THEN
                    RETURN NEW;
                END IF;

                -- Check if facture exists and get its status (1:1 relationship)
                SELECT id, statut 
                INTO v_facture_id, v_facture_statut
                FROM factures
                WHERE commande_id = NEW.id;

                -- If no facture exists yet, allow commande update (facture will be created later)
                IF v_facture_id IS NULL THEN
                    RETURN NEW;
                END IF;

                -- Block update if facture is in a final state
                IF v_facture_statut IN ('payee', 'annulee') THEN
                    RAISE EXCEPTION 
                        'Cannot update commande % (prix: % -> %) - facture % is already % and cannot be modified',
                        NEW.id,
                        OLD.prix,
                        NEW.prix,
                        v_facture_id,
                        v_facture_statut
                    USING 
                        ERRCODE = '23514',
                        HINT = 'You must cancel or reopen the facture before modifying the commande price';
                END IF;

                -- Simplified Logic: Map Commande.prix directly to Facture amounts
                -- Reset breakdown columns to 0 to ensure consistency
                UPDATE factures
                SET
                    -- Zero out breakdown columns (no taxes/reductions tracking)
                    reductions = 0,
                    autre_reductions = 0,
                    taxes = 0,
                    montant_tva = 0,
                    
                    -- Map prix directly to both HT and TTC (no tax calculation)
                    montant_ht = COALESCE(NEW.prix, 0),
                    montant_ttc = COALESCE(NEW.prix, 0),
                    
                    updated_at = NOW()
                WHERE commande_id = NEW.id;

                -- Verify exactly 1 row was updated (enforce 1:1 relationship)
                GET DIAGNOSTICS v_updated_count = ROW_COUNT;
                
                IF v_updated_count = 0 THEN
                    RAISE EXCEPTION 'Failed to update facture % for commande %', v_facture_id, NEW.id;
                ELSIF v_updated_count > 1 THEN
                    RAISE EXCEPTION 
                        'Data integrity violation: found % factures for commande % (expected exactly 1)',
                        v_updated_count,
                        NEW.id;
                END IF;

                RETURN NEW;
            END;
            $$ LANGUAGE plpgsql;
        `);

        // 3. Create the trigger
        await queryRunner.query(`
            DROP TRIGGER IF EXISTS trigger_update_facture_on_commande_change ON commandes;
            
            CREATE TRIGGER trigger_update_facture_on_commande_change
            AFTER UPDATE OF prix ON commandes
            FOR EACH ROW
            WHEN (OLD.prix IS DISTINCT FROM NEW.prix)
            EXECUTE FUNCTION update_facture_from_commande();
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            DROP TRIGGER IF EXISTS trigger_update_facture_on_commande_change ON commandes;
        `);
        await queryRunner.query(`
            DROP FUNCTION IF EXISTS update_facture_from_commande();
        `);
        await queryRunner.query(`
            DROP INDEX IF EXISTS idx_factures_commande_id;
        `);
    }
}
