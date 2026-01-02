import { Entity, Column, PrimaryColumn, OneToOne, JoinColumn } from 'typeorm';
import { Article } from './article.entity';

@Entity('articles_reservation_hotel')
export class ArticleReservationHotel {
  @PrimaryColumn({ type: 'bigint' })
  article_id: number;

  @Column({ type: 'timestamptz', nullable: true })
  date_check_in: Date;

  @Column({ type: 'timestamptz', nullable: true })
  date_check_out: Date;

  @Column({ type: 'integer', nullable: true })
  nombre_nuits: number;

  @Column({ type: 'integer', nullable: true })
  nombre_chambres: number;

  @Column({ type: 'integer', nullable: true })
  nombre_personnes: number;

  @Column({ type: 'text', nullable: true })
  type_chambre: string;

  @Column({ type: 'text', nullable: true, array: true })
  services_hotel: string[];

  @Column({ type: 'text', nullable: true })
  adresse_hotel: string;

  @Column({ type: 'text', nullable: true })
  ville_hotel: string;

  @Column({ type: 'text', nullable: true })
  pays_hotel: string;

  @Column({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  created_at: Date;

  @Column({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  updated_at: Date;

  @OneToOne(() => Article, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'article_id' })
  article: Article;
}

