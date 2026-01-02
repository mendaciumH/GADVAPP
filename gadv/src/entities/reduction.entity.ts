import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn } from 'typeorm';
import { TypeArticle } from './type-article.entity';
import { User } from './user.entity';

@Entity('reductions')
export class Reduction {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: number;

  @Column({ type: 'bigint', nullable: true })
  type_article_id: number;

  @Column({ type: 'text', nullable: true })
  reference: string;

  @Column({ type: 'boolean', nullable: true })
  reduction_fixe: boolean;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  montant_reduction_fixe: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  reduction_pourcentage: number;

  @Column({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  created_at: Date;

  @Column({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  updated_at: Date;

  @ManyToOne(() => TypeArticle, typeArticle => typeArticle.reductions)
  @JoinColumn({ name: 'type_article_id' })
  typeArticle: TypeArticle;

  @Column({ type: 'bigint', nullable: true })
  user_id: number;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;
}

