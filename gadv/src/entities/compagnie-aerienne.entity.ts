import { Entity, Column, PrimaryGeneratedColumn, OneToMany } from 'typeorm';
import { ArticleBilletAvion } from './article-billet-avion.entity';

@Entity('compagnies_aeriennes')
export class CompagnieAerienne {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: number;

  @Column({ type: 'text' })
  nom: string;

  @Column({ type: 'text', nullable: true })
  code_iata?: string;

  @Column({ type: 'text', nullable: true })
  code_icao?: string;

  @Column({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  created_at: Date;

  @Column({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  updated_at: Date;

  @OneToMany(() => ArticleBilletAvion, (articleBilletAvion: ArticleBilletAvion) => articleBilletAvion.compagnieAerienne)
  articlesBilletAvion: ArticleBilletAvion[];
}

