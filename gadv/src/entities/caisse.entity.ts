import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from './user.entity';

@Entity('caisses')
export class Caisse {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: number;

  @Column({ type: 'text' })
  nom_caisse: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true, default: 0 })
  montant_depart: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true, default: 0 })
  solde_actuel: number;

  @Column({ type: 'text', nullable: true, default: 'DZD' })
  devise: string;

  @Column({ type: 'boolean', default: false })
  is_principale: boolean;

  @Column({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  created_at: Date;

  @Column({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  updated_at: Date;

  @Column({ type: 'bigint', nullable: true })
  user_id: number;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;
}

