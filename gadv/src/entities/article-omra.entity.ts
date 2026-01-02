import { Entity, Column, PrimaryColumn, OneToOne, JoinColumn } from 'typeorm';
import { Article } from './article.entity';

@Entity('articles_omra')
export class ArticleOmra {
  @PrimaryColumn({ type: 'bigint' })
  article_id: number;

  @Column({ type: 'text', nullable: true })
  nom_hotel: string;

  @Column({ type: 'integer', nullable: true })
  distance_hotel: number;

  @Column({ type: 'text', nullable: true })
  entree: string;

  @Column({ type: 'text', nullable: true })
  sortie: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  tarif_additionnel: number;

  @Column({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  created_at: Date;

  @Column({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  updated_at: Date;

  @OneToOne(() => Article, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'article_id' })
  article: Article;
}

