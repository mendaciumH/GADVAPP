import { Entity, Column, PrimaryGeneratedColumn, DataSource, OneToMany, ManyToOne, JoinColumn, Check } from 'typeorm';
import { Commande } from './commande.entity';
import { User } from './user.entity';

@Entity('clients')
@Check(`"type_client" = ANY(ARRAY['Particulier':: text, 'Entreprise':: text])`)
export class Client {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: number;

  @Column({ type: 'text' })
  type_client: string;

  @Column({ type: 'text', nullable: true })
  nom_complet: string;

  @Column({ type: 'text', nullable: true })
  numero_passeport: string;

  @Column({ type: 'date', nullable: true })
  expiration_passeport: Date;

  @Column({ type: 'text', nullable: true })
  numero_mobile: string;

  @Column({ type: 'text', nullable: true })
  numero_mobile_2: string;

  @Column({ type: 'text', nullable: true })
  email: string;

  @Column({ type: 'date', nullable: true })
  date_naissance: Date;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column({ type: 'bytea', nullable: true })
  image: Buffer;

  @Column({ type: 'text', nullable: true })
  nom_entreprise: string;

  @Column({ type: 'text', nullable: true })
  rc: string;

  @Column({ type: 'text', nullable: true })
  nif: string;

  @Column({ type: 'text', nullable: true })
  ai: string;

  @Column({ type: 'text', nullable: true })
  nis: string;

  @Column({ type: 'boolean', nullable: true })
  prefere_facturation: boolean;

  @Column({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  created_at: Date;

  @Column({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  updated_at: Date;

  @OneToMany(() => Commande, (commande: Commande) => commande.client)
  commandes: Commande[];

  @Column({ type: 'bigint', nullable: true })
  user_id: number;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;
}

