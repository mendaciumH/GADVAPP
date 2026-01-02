import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Client } from './client.entity';
import { Commande } from './commande.entity';
import { Facture } from './facture.entity';
import { User } from './user.entity';

@Entity('bon_de_versement')
export class BonDeVersement {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: number;

  @Column({ type: 'text', unique: true })
  numero: string;

  @Column({ type: 'date' })
  date_versement: Date;

  @Column({ type: 'bigint' })
  client_id: number;

  @Column({ type: 'bigint' })
  commande_id: number;

  @Column({ type: 'bigint', nullable: true })
  facture_id: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  montant_verse: number;

  @Column({ type: 'boolean', default: false })
  annule: boolean;

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

  @ManyToOne(() => Facture, { nullable: true })
  @JoinColumn({ name: 'facture_id' })
  facture: Facture;

  @Column({ type: 'bigint', nullable: true })
  user_id: number;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;
}

