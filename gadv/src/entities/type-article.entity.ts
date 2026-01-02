import { Entity, Column, PrimaryGeneratedColumn, OneToMany } from 'typeorm';
import { Article } from './article.entity';
import { Reduction } from './reduction.entity';
import { Taxe } from './taxe.entity';

@Entity('type_article')
export class TypeArticle {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: number;

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  created_at: Date;

  @Column({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  updated_at: Date;

  @OneToMany(() => Article, (article: Article) => article.typeArticle)
  articles: Article[];

  @OneToMany(() => Reduction, (reduction: Reduction) => reduction.typeArticle)
  reductions: Reduction[];

  @OneToMany(() => Taxe, (taxe: Taxe) => taxe.typeArticle)
  taxes: Taxe[];
}

