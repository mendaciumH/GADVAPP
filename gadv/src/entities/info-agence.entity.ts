import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity('info_agence')
export class InfoAgence {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: number;

  @Column({ type: 'text' })
  nom_agence: string;

  @Column({ type: 'text', nullable: true })
  tel: string;

  @Column({ type: 'text', nullable: true })
  email: string;

  @Column({ type: 'text', nullable: true })
  adresse: string;

  @Column({ type: 'text', nullable: true })
  site_web: string;

  @Column({ type: 'text', nullable: true })
  code_iata: string;

  @Column({ type: 'text', nullable: true })
  logo: string;

  @Column({ type: 'text', nullable: true })
  prefix_factures: string;

  @Column({ type: 'text', nullable: true })
  pied_facture: string;

  @Column({ type: 'text', nullable: true })
  n_licence: string;
  
  @Column({ type: 'text', nullable: true })
  fax: string;

  @Column({type:'text', nullable: true})
  n_rc: string;

  @Column({type:'text', nullable: true})
  ar: string;

  @Column({type:'text', nullable: true})
  nis: string;

  @Column({type:'text', nullable: true})
  nif: string;
  
  @Column({type:'text', nullable: true})
  rib: string;

  @Column({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  created_at: Date;

  @Column({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  updated_at: Date;
}

