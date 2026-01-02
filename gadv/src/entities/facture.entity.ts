import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Commande } from './commande.entity';
import { User } from './user.entity';

export type FactureStatut = 'en_attente' | 'payee' | 'annulee' | 'impayee';
export type FactureModeReglement = 'espèce' | 'chèque';

@Entity('factures')
export class Facture {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: number;

  @Column({ type: 'bigint' })
  commande_id: number;

  @Column({ type: 'text', unique: true })
  numero_facture: string;

  @Column({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  date_facture: Date;

  @Column({ type: 'date', nullable: true })
  date_echeance: Date;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  montant_ht: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  montant_tva: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  montant_ttc: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0, nullable: true })
  reductions: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0, nullable: true })
  autre_reductions: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0, nullable: true })
  taxes: number;

  @Column({
    type: 'enum',
    enum: ['en_attente', 'payee', 'annulee', 'impayee'],
    default: 'en_attente'
  })
  statut: FactureStatut;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column({
    type: 'enum',
    enum: ['espèce', 'chèque'],
    nullable: true
  })
  mode_reglement: FactureModeReglement;

  @Column({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  created_at: Date;

  @Column({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  updated_at: Date;

  @ManyToOne(() => Commande, commande => commande.factures)
  @JoinColumn({ name: 'commande_id' })
  commande: Commande;

  @Column({ type: 'bigint', nullable: true })
  user_id: number;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;
}

