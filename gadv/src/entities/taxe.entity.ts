import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn } from 'typeorm';
import { TypeArticle } from './type-article.entity';
import { User } from './user.entity';

@Entity('taxes')
export class Taxe {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: number;

  @Column({ type: 'bigint', nullable: true })
  id_type_article: number;

  @Column({ type: 'text', nullable: true })
  reference: string;

  @Column({ type: 'boolean', nullable: true })
  taxe_fixe: boolean;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  montant_taxe_fixe: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  taxe_pourcentage: number;

  @Column({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  created_at: Date;

  @Column({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  updated_at: Date;

  @ManyToOne(() => TypeArticle, typeArticle => typeArticle.taxes)
  @JoinColumn({ name: 'id_type_article' })
  typeArticle: TypeArticle;

  @Column({ type: 'bigint', nullable: true })
  user_id: number;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;
}

