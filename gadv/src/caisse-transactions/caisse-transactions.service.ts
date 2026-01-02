import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, QueryRunner } from 'typeorm';
import { CaisseTransaction, TransactionType, ReferenceType } from '../entities/caisse-transaction.entity';
import { Caisse } from '../entities/caisse.entity';
import { User } from '../entities/user.entity';

@Injectable()
export class CaisseTransactionsService {
    constructor(
        @InjectRepository(CaisseTransaction)
        private caisseTransactionRepository: Repository<CaisseTransaction>,
        @InjectRepository(Caisse)
        private caisseRepository: Repository<Caisse>,
        private dataSource: DataSource,
    ) { }

    async createTransaction(
        caisseId: number,
        userId: number | null,
        type: TransactionType,
        montant: number,
        referenceType: ReferenceType,
        referenceId: number,
        description?: string,
        providedQueryRunner?: QueryRunner,
    ): Promise<CaisseTransaction> {
        const queryRunner = providedQueryRunner || this.dataSource.createQueryRunner();

        if (!providedQueryRunner) {
            await queryRunner.connect();
            await queryRunner.startTransaction();
        }

        try {
            const caisse = await queryRunner.manager.findOne(Caisse, { where: { id: caisseId } });
            if (!caisse) {
                throw new NotFoundException(`Caisse with ID ${caisseId} not found`);
            }

            // Update caisse balance
            const currentSolde = Number(caisse.solde_actuel) || 0;
            const transactionAmount = Number(montant);

            if (type === TransactionType.ENCAISSEMENT) {
                caisse.solde_actuel = currentSolde + transactionAmount;
            } else {
                caisse.solde_actuel = currentSolde - transactionAmount;
            }

            caisse.updated_at = new Date();
            await queryRunner.manager.save(Caisse, caisse);

            // Create transaction record
            const transaction = queryRunner.manager.create(CaisseTransaction, {
                caisse_id: caisseId,
                user_id: userId ?? undefined,
                type,
                montant: transactionAmount,
                reference_type: referenceType,
                reference_id: referenceId,
                description,
                date_transaction: new Date(),
            });

            const savedTransaction = await queryRunner.manager.save(CaisseTransaction, transaction);

            if (!providedQueryRunner) {
                await queryRunner.commitTransaction();
            }

            return savedTransaction;
        } catch (error) {
            if (!providedQueryRunner) {
                await queryRunner.rollbackTransaction();
            }
            throw error;
        } finally {
            if (!providedQueryRunner) {
                await queryRunner.release();
            }
        }
    }

    async findAll(filters: any = {}, user?: any): Promise<CaisseTransaction[]> {
        // Permission Logic
        if (user) {
            const permissions: string[] = user.permissions || [];
            const roles: string[] = user.roles || [];
            const isAdmin = roles.some((r: string) => r.toLowerCase().includes('admin'));

            const hasGlobalAccess = isAdmin || permissions.includes('view_caisse_transactions') || permissions.includes('manage_caisse_transactions');
            const hasOmraAccess = permissions.includes('view_caisse_omra') || permissions.includes('manage_caisse_omra');

            if (hasGlobalAccess) {
                // Return all (or whatever filters are passed)
            } else if (hasOmraAccess) {
                // Restrict to Omra Caisse (ID 2)
                filters.caisseId = 2;
                // Ensure users can't bypass by passing a different ID in query params if logic was different,
                // but here we overwrite it, so it's safe.
            } else {
                return [];
            }
        }

        const queryBuilder = this.caisseTransactionRepository.createQueryBuilder('transaction')
            .leftJoinAndSelect('transaction.caisse', 'caisse')
            .leftJoinAndSelect('transaction.user', 'user')
            .orderBy('transaction.date_transaction', 'DESC');

        if (filters.caisseId) {
            queryBuilder.andWhere('transaction.caisse_id = :caisseId', { caisseId: filters.caisseId });
        }

        if (filters.type) {
            queryBuilder.andWhere('transaction.type = :type', { type: filters.type });
        }

        if (filters.dateFrom) {
            queryBuilder.andWhere('transaction.date_transaction >= :dateFrom', { dateFrom: filters.dateFrom });
        }

        if (filters.dateTo) {
            queryBuilder.andWhere('transaction.date_transaction <= :dateTo', { dateTo: filters.dateTo });
        }

        return queryBuilder.getMany();
    }

    async findByCaisseId(caisseId: number): Promise<CaisseTransaction[]> {
        return this.findAll({ caisseId });
    }

    async findOmraTransactions(): Promise<CaisseTransaction[]> {
        const caisseOmra = await this.caisseRepository.createQueryBuilder('caisse')
            .where('LOWER(caisse.nom_caisse) = LOWER(:name)', { name: 'Caisse Omra' })
            .getOne();

        if (!caisseOmra) {
            return [];
        }

        return this.findAll({ caisseId: caisseOmra.id });
    }

    async findCaisseForArticleType(articleTypeId?: number): Promise<Caisse | null> {
        let caisse: Caisse | null = null;

        console.log(`🔍 Finding Caisse for Article Type ID: ${articleTypeId} (Type: ${typeof articleTypeId})`);


        // Type 1 is Omra -> Caisse Omra
        const typeId = Number(articleTypeId);

        if (typeId === 1) {
            console.log('🕋 Article is Omra (Type 1). Looking for Caisse Omra...');
            // Try case-insensitive search
            caisse = await this.caisseRepository.createQueryBuilder('caisse')
                .where('LOWER(caisse.nom_caisse) = LOWER(:name)', { name: 'Caisse Omra' })
                .getOne();

            console.log(caisse ? '✅ Found Caisse Omra' : '❌ Caisse Omra NOT found');
        }

        // If not Omra or Caisse Omra not found, use Caisse Principale
        if (!caisse) {
            console.log('🏦 Looking for Caisse Principale (Fallback)...');
            caisse = await this.caisseRepository.findOne({
                where: { is_principale: true },
            });
            console.log(caisse ? `✅ Found Caisse Principale: ${caisse.nom_caisse}` : '❌ Caisse Principale NOT found');

            if (!caisse) {
                // Last resort: Log all available caisses
                const allCaisses = await this.caisseRepository.find();
                console.log('Available Caisses:', allCaisses.map(c => ({ id: c.id, name: c.nom_caisse, principale: c.is_principale })));
            }
        }

        return caisse;
    }
}
