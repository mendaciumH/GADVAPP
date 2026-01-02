import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Caisse } from './caisse.entity';
import { User } from './user.entity';

export enum TransactionType {
    ENCAISSEMENT = 'encaissement',
    DECAISSEMENT = 'décaissement',
}

export enum ReferenceType {
    FACTURE = 'facture',
    BON_VERSEMENT = 'bon_versement',
    BON_REMBOURSEMENT = 'bon_remboursement',
}

@Entity('caisse_transactions')
export class CaisseTransaction {
    @PrimaryGeneratedColumn({ type: 'bigint' })
    id: number;

    @Column({ type: 'bigint' })
    caisse_id: number;

    @Column({ type: 'bigint', nullable: true })
    user_id: number;

    @Column({
        type: 'enum',
        enum: TransactionType,
    })
    type: TransactionType;

    @Column({ type: 'decimal', precision: 10, scale: 2 })
    montant: number;

    @Column({
        type: 'enum',
        enum: ReferenceType,
    })
    reference_type: ReferenceType;

    @Column({ type: 'bigint' })
    reference_id: number;

    @Column({ type: 'text', nullable: true })
    description: string;

    @Column({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
    date_transaction: Date;

    @Column({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
    created_at: Date;

    @Column({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
    updated_at: Date;

    @ManyToOne(() => Caisse)
    @JoinColumn({ name: 'caisse_id' })
    caisse: Caisse;

    @ManyToOne(() => User)
    @JoinColumn({ name: 'user_id' })
    user: User;
}
