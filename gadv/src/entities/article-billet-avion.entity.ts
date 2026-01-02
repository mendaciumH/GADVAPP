import { Entity, Column, PrimaryColumn, OneToOne, JoinColumn, ManyToOne } from 'typeorm';
import { Article } from './article.entity';
import { CompagnieAerienne } from './compagnie-aerienne.entity';

@Entity('articles_billet_avion')
export class ArticleBilletAvion {
  @PrimaryColumn({ type: 'bigint' })
  article_id: number;

  @Column({ type: 'text', nullable: true })
  aeroport_depart: string;

  @Column({ type: 'text', nullable: true })
  aeroport_arrivee: string;

  @Column({ type: 'timestamptz', nullable: true })
  date_depart_vol: Date;

  @Column({ type: 'timestamptz', nullable: true })
  date_retour_vol: Date;

  @Column({ type: 'bigint', nullable: true })
  compagnie_aerienne_id: number;

  @Column({ type: 'text', nullable: true })
  numero_vol: string;

  @Column({ type: 'text', nullable: true })
  classe_vol: string;

  @Column({ type: 'text', nullable: true, array: true })
  escales: string[];

  @Column({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  created_at: Date;

  @Column({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  updated_at: Date;

  @OneToOne(() => Article, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'article_id' })
  article: Article;

  @ManyToOne(() => CompagnieAerienne)
  @JoinColumn({ name: 'compagnie_aerienne_id' })
  compagnieAerienne: CompagnieAerienne;
}

