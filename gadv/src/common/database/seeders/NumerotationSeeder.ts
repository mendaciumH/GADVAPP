import { DataSource } from 'typeorm';
import { Numerotation, NumerotationType } from '../../../entities/numerotation.entity';

export const seedNumerotations = async (dataSource: DataSource): Promise<void> => {
    try {
        const numerotationRepo = dataSource.getRepository(Numerotation);

        // 1. Seed FACTURE
        const existingFacture = await numerotationRepo.findOne({
            where: { type: NumerotationType.FACTURE }
        });

        if (!existingFacture) {
            await numerotationRepo.save({
                type: NumerotationType.FACTURE,
                prefix: 'FACT',
                format: '{PREFIX}-{YYYY}{MM}-{SEQ}',
                counter: 0,
                reset_interval: 'YEARLY'
            });
            console.log('✅ Numerotation FACTURE created successfully!');
        } else {
            console.log('Numerotation FACTURE already exists, skipping seed...');
        }

        // 2. Seed BON_VERSEMENT
        const existingBon = await numerotationRepo.findOne({
            where: { type: NumerotationType.BON_VERSEMENT }
        });

        if (!existingBon) {
            await numerotationRepo.save({
                type: NumerotationType.BON_VERSEMENT,
                prefix: 'BV',
                format: '{PREFIX}-{YYYY}{MM}-{SEQ}',
                counter: 0,
                reset_interval: 'YEARLY'
            });
            console.log('✅ Numerotation BON_VERSEMENT created successfully!');
        } else {
            console.log('Numerotation BON_VERSEMENT already exists, skipping seed...');
        }

        // 3. Seed BON_COMMANDE
        const existingBonCommande = await numerotationRepo.findOne({
            where: { type: NumerotationType.BON_COMMANDE }
        });

        if (!existingBonCommande) {
            await numerotationRepo.save({
                type: NumerotationType.BON_COMMANDE,
                prefix: 'BC',
                format: '{PREFIX}-{YYYY}{MM}-{SEQ}',
                counter: 0,
                reset_interval: 'YEARLY'
            });
            console.log('✅ Numerotation BON_COMMANDE created successfully!');
        } else {
            console.log('Numerotation BON_COMMANDE already exists, skipping seed...');
        }

        // 4. Seed BON_REMBOURSEMENT
        const existingBonRemboursement = await numerotationRepo.findOne({
            where: { type: NumerotationType.BON_REMBOURSEMENT }
        });

        if (!existingBonRemboursement) {
            await numerotationRepo.save({
                type: NumerotationType.BON_REMBOURSEMENT,
                prefix: 'BR',
                format: '{PREFIX}-{YYYY}{MM}-{SEQ}',
                counter: 0,
                reset_interval: 'YEARLY'
            });
            console.log('✅ Numerotation BON_REMBOURSEMENT created successfully!');
        } else {
            console.log('Numerotation BON_REMBOURSEMENT already exists, skipping seed...');
        }

    } catch (error: any) {
        console.error('Error seeding numerotations:', error.message);
    }
};
