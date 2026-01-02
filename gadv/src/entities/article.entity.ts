import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { Fournisseur } from './fournisseur.entity';
import { TypeArticle } from './type-article.entity';
import { Commande } from './commande.entity';
import { CompagnieAerienne } from './compagnie-aerienne.entity';
import { Session } from './session.entity';
import { Chambre } from './chambre.entity';
import { User } from './user.entity';

@Entity('articles')
export class Article {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: number;

  @Column({ type: 'timestamptz', nullable: true })
  date_depart?: Date;

  @Column({ type: 'text' })
  label: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'text', nullable: true })
  image_banner?: string;

  @Column({ type: 'bigint', nullable: true })
  fournisseur_id?: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  commission?: number;

  @Column({ type: 'boolean', nullable: true })
  offre_limitee?: boolean;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  prix_offre?: number;

  @Column({ type: 'boolean', nullable: true })
  is_archiver?: boolean;

  @Column({ type: 'boolean', nullable: true, default: false })
  is_published?: boolean;

  @Column({ type: 'bigint', nullable: true })
  id_type_article?: number;

  // General fields for all article types
  @Column({ type: 'text', nullable: true })
  ville_depart?: string;

  @Column({ type: 'timestamptz', nullable: true })
  date_retour?: Date;

  @Column({ type: 'bigint', nullable: true })
  compagnie_aerienne_id?: number;

  @Column({ type: 'text', nullable: true })
  type_fly?: string;

  @Column({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  created_at: Date;

  @Column({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  updated_at: Date;

  @ManyToOne(() => Fournisseur, fournisseur => fournisseur.articles)
  @JoinColumn({ name: 'fournisseur_id' })
  fournisseur: Fournisseur;

  @ManyToOne(() => TypeArticle, typeArticle => typeArticle.articles)
  @JoinColumn({ name: 'id_type_article' })
  typeArticle: TypeArticle;

  @ManyToOne(() => CompagnieAerienne)
  @JoinColumn({ name: 'compagnie_aerienne_id' })
  compagnieAerienne: CompagnieAerienne;

  @OneToMany(() => Commande, (commande: Commande) => commande.article)
  commandes: Commande[];

  @OneToMany(() => Session, session => session.article)
  sessions: Session[];

  @Column({ type: 'bigint', nullable: true })
  user_id: number;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @OneToMany(() => Chambre, chambre => chambre.article)
  chambres: Chambre[];
}

