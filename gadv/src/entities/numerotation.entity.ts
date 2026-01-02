import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

export enum NumerotationType {
    FACTURE = 'FACTURE',
    BON_VERSEMENT = 'BON_VERSEMENT',
    BON_COMMANDE = 'BON_COMMANDE',
    BON_REMBOURSEMENT = 'BON_REMBOURSEMENT',
}

@Entity('numerotations')
export class Numerotation {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({
        type: 'enum',
        enum: NumerotationType,
        unique: true,
    })
    type: NumerotationType;

    @Column({ type: 'varchar', length: 10 })
    prefix: string;

    @Column({ type: 'varchar', length: 50, default: '{PREFIX}-{YYYY}{MM}-{SEQ}' })
    format: string;

    @Column({ type: 'int', default: 0 })
    counter: number;

    @Column({ type: 'varchar', length: 20, default: 'MONTHLY' }) // YEARLY, MONTHLY, NONE
    reset_interval: string;

    @Column({ type: 'date', nullable: true })
    last_reset: Date;

    @CreateDateColumn()
    created_at: Date;

    @UpdateDateColumn()
    updated_at: Date;
}
