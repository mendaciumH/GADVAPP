import { Entity, Column, PrimaryColumn, OneToOne, JoinColumn } from 'typeorm';
import { Article } from './article.entity';

@Entity('articles_voyage')
export class ArticleVoyage {
  @PrimaryColumn({ type: 'bigint' })
  article_id: number;

  @Column({ type: 'text', nullable: true })
  destination: string;

  @Column({ type: 'timestamptz', nullable: true })
  date_retour: Date;

  @Column({ type: 'text', nullable: true })
  duree_voyage: string;

  @Column({ type: 'text', nullable: true })
  type_hebergement: string;

  @Column({ type: 'text', nullable: true })
  transport: string;

  @Column({ type: 'text', nullable: true, array: true })
  programme: string[];

  @Column({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  created_at: Date;

  @Column({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  updated_at: Date;

  @OneToOne(() => Article, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'article_id' })
  article: Article;
}

