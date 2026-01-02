import { Entity, Column, PrimaryColumn, OneToOne, JoinColumn } from 'typeorm';
import { Article } from './article.entity';

@Entity('articles_visa')
export class ArticleVisa {
  @PrimaryColumn({ type: 'bigint' })
  article_id: number;

  @Column({ type: 'text', nullable: true })
  pays_destination: string;

  @Column({ type: 'text', nullable: true })
  type_visa: string;

  @Column({ type: 'text', nullable: true })
  duree_validite: string;

  @Column({ type: 'text', nullable: true })
  delai_traitement: string;

  @Column({ type: 'text', nullable: true, array: true })
  documents_requis: string[];

  @Column({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  created_at: Date;

  @Column({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  updated_at: Date;

  @OneToOne(() => Article, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'article_id' })
  article: Article;
}

