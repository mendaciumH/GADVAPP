import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Numerotation, NumerotationType } from '../entities/numerotation.entity';

@Injectable()
export class NumerotationsService {
    constructor(
        @InjectRepository(Numerotation)
        private numerotationRepository: Repository<Numerotation>,
        private dataSource: DataSource,
    ) { }

    async findAll(): Promise<Numerotation[]> {
        return this.numerotationRepository.find({
            order: { type: 'ASC' },
        });
    }

    async update(id: number, updateData: Partial<Numerotation>): Promise<Numerotation> {
        const numerotation = await this.numerotationRepository.findOne({ where: { id } });
        if (!numerotation) {
            throw new NotFoundException(`Numerotation #${id} not found`);
        }

        Object.assign(numerotation, updateData);
        return this.numerotationRepository.save(numerotation);
    }

    /**
     * Generates the next number for a given type safely handling concurrency and resets.
     */
    async getNextNumber(type: NumerotationType): Promise<string> {
        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            // Lock the row for update
            const numerotation = await queryRunner.manager
                .createQueryBuilder(Numerotation, 'n')
                .setLock('pessimistic_write')
                .where('n.type = :type', { type })
                .getOne();

            if (!numerotation) {
                throw new NotFoundException(`Numerotation type ${type} not found`);
            }

            // Check for reset
            const now = new Date();
            let shouldReset = false;

            if (numerotation.last_reset) {
                const lastReset = new Date(numerotation.last_reset);

                if (numerotation.reset_interval === 'YEARLY') {
                    shouldReset = lastReset.getFullYear() !== now.getFullYear();
                } else if (numerotation.reset_interval === 'MONTHLY') {
                    shouldReset = lastReset.getFullYear() !== now.getFullYear() ||
                        lastReset.getMonth() !== now.getMonth();
                }
            } else {
                // First time usage, force reset/set date
                shouldReset = true;
            }

            if (shouldReset) {
                numerotation.counter = 1;
                numerotation.last_reset = now;
            } else {
                numerotation.counter += 1;
            }

            await queryRunner.manager.save(numerotation);
            await queryRunner.commitTransaction();

            // Format the number
            return this.formatNumber(numerotation, now);
        } catch (err) {
            await queryRunner.rollbackTransaction();
            throw err;
        } finally {
            await queryRunner.release();
        }
    }

    private formatNumber(numerotation: Numerotation, date: Date): string {
        const year = date.getFullYear().toString();
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const day = date.getDate().toString().padStart(2, '0');
        const seq = numerotation.counter.toString().padStart(4, '0'); // Default 4 chars padding

        return numerotation.format
            .replace('{PREFIX}', numerotation.prefix)
            .replace('{YYYY}', year)
            .replace('{YY}', year.substring(2))
            .replace('{MM}', month)
            .replace('{DD}', day)
            .replace('{SEQ}', seq);
    }

    /**
     * Preview the next number without incrementing the counter
     */
    async getPreviewNumber(type: NumerotationType): Promise<string> {
        const numerotation = await this.numerotationRepository.findOne({
            where: { type }
        });

        if (!numerotation) {
            throw new NotFoundException(`Numerotation type ${type} not found`);
        }

        const now = new Date();
        let previewCounter = numerotation.counter;

        // Check if reset would occur
        if (numerotation.last_reset) {
            const lastReset = new Date(numerotation.last_reset);
            let shouldReset = false;

            if (numerotation.reset_interval === 'YEARLY') {
                shouldReset = lastReset.getFullYear() !== now.getFullYear();
            } else if (numerotation.reset_interval === 'MONTHLY') {
                shouldReset = lastReset.getFullYear() !== now.getFullYear() ||
                    lastReset.getMonth() !== now.getMonth();
            }

            if (shouldReset) {
                previewCounter = 1;
            } else {
                previewCounter += 1;
            }
        } else {
            // First time usage
            previewCounter = 1;
        }

        // Create a temporary numerotation object for formatting
        const tempNumerotation = { ...numerotation, counter: previewCounter };
        return this.formatNumber(tempNumerotation, now);
    }
}
