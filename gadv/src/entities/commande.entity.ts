import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { Client } from './client.entity';
import { Article } from './article.entity';
import { Session } from './session.entity';
import { Facture } from './facture.entity';
import { BonDeVersement } from './bon-de-versement.entity';
import { User } from './user.entity';
import { Chambre } from './chambre.entity';

@Entity('commandes')
export class Commande {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: number;

  @Column({ type: 'bigint', nullable: true })
  client_id: number;

  @Column({ type: 'bigint', nullable: true })
  article_id: number;

  @Column({ type: 'bigint', nullable: true })
  session_id: number;

  @Column({ type: 'timestamptz', nullable: true })
  date: Date;

  @Column({ type: 'boolean', nullable: true })
  beneficiaire: boolean;

  @Column({ type: 'text', nullable: true })
  nom: string;

  @Column({ type: 'text', nullable: true })
  prenom: string;

  @Column({ type: 'date', nullable: true })
  date_naissance: Date;

  @Column({ type: 'text', nullable: true })
  genre: string;

  @Column({ type: 'text', nullable: true })
  numero_passport: string;

  @Column({ type: 'date', nullable: true })
  date_expiration_passport: Date;

  @Column({ type: 'text', nullable: true })
  numero_mobile: string;

  @Column({ type: 'text', nullable: true })
  remarques: string;

  @Column({ type: 'bytea', nullable: true })
  image: Buffer;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  prix: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  reductions: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  autre_reductions: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  taxes: number;

  @Column({ type: 'integer', nullable: true })
  nombre_personnes: number;

  @Column({ type: 'integer', nullable: true })
  chambre_id: number;

  @Column({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  created_at: Date;

  @Column({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  updated_at: Date;

  @Column({ type: 'bigint', nullable: true })
  user_id: number;

  @Column({ type: 'varchar', length: 50, nullable: true })
  numero_bon_commande: string;

  @Column({ type: 'varchar', length: 20, default: 'active' })
  statut: 'active' | 'annulee';

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => Client, client => client.commandes)
  @JoinColumn({ name: 'client_id' })
  client: Client;

  @ManyToOne(() => Article, article => article.commandes)
  @JoinColumn({ name: 'article_id' })
  article: Article;

  @ManyToOne(() => Session, session => session.commandes)
  @JoinColumn({ name: 'session_id' })
  session: Session;

  @ManyToOne(() => Chambre)
  @JoinColumn({ name: 'chambre_id' })
  chambre: Chambre;

  @OneToMany(() => Facture, facture => facture.commande)
  factures: Facture[];

  @OneToMany(() => BonDeVersement, bonDeVersement => bonDeVersement.commande)
  bons_de_versement: BonDeVersement[];
}

