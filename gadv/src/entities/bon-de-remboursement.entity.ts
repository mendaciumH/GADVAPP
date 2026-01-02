import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Client } from './client.entity';
import { Commande } from './commande.entity';
import { User } from './user.entity';

@Entity('bon_de_remboursement')
export class BonDeRemboursement {
    @PrimaryGeneratedColumn({ type: 'bigint' })
    id: number;

    @Column({ type: 'varchar', length: 50, unique: true })
    numero: string;

    @Column({ type: 'bigint' })
    client_id: number;

    @Column({ type: 'bigint' })
    commande_id: number;

    @Column({ type: 'decimal', precision: 10, scale: 2 })
    montant: number;

    @Column({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
    date_remboursement: Date;

    @Column({ type: 'text', nullable: true })
    motif: string;

    @Column({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
    created_at: Date;

    @Column({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
    updated_at: Date;

    @ManyToOne(() => Client)
    @JoinColumn({ name: 'client_id' })
    client: Client;

    @ManyToOne(() => Commande)
    @JoinColumn({ name: 'commande_id' })
    commande: Commande;

    @Column({ type: 'bigint', nullable: true })
    user_id: number;

    @ManyToOne(() => User)
    @JoinColumn({ name: 'user_id' })
    user: User;
}
