import { Entity, Column, PrimaryColumn, OneToOne, JoinColumn } from 'typeorm';
import { Article } from './article.entity';

@Entity('articles_assurance')
export class ArticleAssurance {
  @PrimaryColumn({ type: 'bigint' })
  article_id: number;

  @Column({ type: 'text', nullable: true })
  type_assurance: string;

  @Column({ type: 'text', nullable: true })
  duree_couverture: string;

  @Column({ type: 'text', nullable: true })
  zone_couverture: string;

  @Column({ type: 'text', nullable: true })
  montant_couverture: string;

  @Column({ type: 'text', nullable: true })
  franchise: string;

  @Column({ type: 'text', nullable: true, array: true })
  conditions_particulieres: string[];

  @Column({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  created_at: Date;

  @Column({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  updated_at: Date;

  @OneToOne(() => Article, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'article_id' })
  article: Article;
}

