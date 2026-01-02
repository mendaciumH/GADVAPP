import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Client } from '../entities/client.entity';
import { CreateClientDto, ClientType } from './dto/create-client.dto';
import { UpdateClientDto } from './dto/update-client.dto';
const XLSX = require('xlsx');

@Injectable()
export class ClientsService {
  constructor(
    @InjectRepository(Client)
    private clientRepository: Repository<Client>,
  ) { }

  async findAll(): Promise<Client[]> {
    return this.clientRepository.find({
      order: { id: 'DESC' },
    });
  }

  async findOne(id: number): Promise<Client> {
    const client = await this.clientRepository.findOne({
      where: { id },
    });

    if (!client) {
      throw new NotFoundException(`Client with ID ${id} not found`);
    }

    return client;
  }

  async create(createClientDto: CreateClientDto, user?: any): Promise<Client> {
    const typeClient = createClientDto.type_client || 'Particulier';

    // Validate required fields based on client type
    if (typeClient === 'Particulier') {
      if (!createClientDto.nom_complet?.trim()) {
        throw new BadRequestException('Le nom complet (nom et prénom) est requis pour un particulier');
      }
    } else if (typeClient === 'Entreprise') {
      if (!createClientDto.nom_entreprise?.trim()) {
        throw new BadRequestException('Le nom de l\'entreprise est requis pour une entreprise');
      }
    }

    // Convert date_naissance string to Date if provided and not empty
    const dateNaissance = createClientDto.date_naissance?.trim()
      ? new Date(createClientDto.date_naissance.trim())
      : undefined;

    const expirationPasseport = createClientDto.expiration_passeport?.trim()
      ? new Date(createClientDto.expiration_passeport.trim())
      : undefined;

    const client = this.clientRepository.create({
      type_client: createClientDto.type_client || 'Particulier',
      nom_complet: createClientDto.nom_complet?.trim() || undefined,
      numero_passeport: createClientDto.numero_passeport?.trim() || undefined,
      expiration_passeport: expirationPasseport,
      numero_mobile: createClientDto.numero_mobile?.trim() || undefined,
      numero_mobile_2: createClientDto.numero_mobile_2?.trim() || undefined,
      email: createClientDto.email?.trim() || undefined,
      date_naissance: dateNaissance,
      notes: createClientDto.notes?.trim() || undefined,
      nom_entreprise: createClientDto.nom_entreprise?.trim() || undefined,
      rc: createClientDto.rc?.trim() || undefined,
      nif: createClientDto.nif?.trim() || undefined,
      ai: createClientDto.ai?.trim() || undefined,
      nis: createClientDto.nis?.trim() || undefined,
      prefere_facturation: createClientDto.prefere_facturation || false,
      user_id: user?.id,
    });

    return this.clientRepository.save(client);
  }

  async update(
    id: number,
    updateClientDto: UpdateClientDto,
  ): Promise<Client> {
    const client = await this.findOne(id);

    // Validate required fields for Particulier
    const finalType = updateClientDto.type_client || client.type_client;
    const finalNomComplet = updateClientDto.nom_complet !== undefined
      ? updateClientDto.nom_complet
      : client.nom_complet;
    if (finalType === 'Particulier' && !finalNomComplet) {
      throw new BadRequestException('nom_complet is required for Particulier');
    }

    if (updateClientDto.type_client !== undefined) {
      client.type_client = updateClientDto.type_client;
    }
    if (updateClientDto.nom_complet !== undefined) {
      (client as any).nom_complet = updateClientDto.nom_complet?.trim() || undefined;
    }
    if (updateClientDto.numero_passeport !== undefined) {
      (client as any).numero_passeport = updateClientDto.numero_passeport?.trim() || undefined;
    }
    if (updateClientDto.expiration_passeport !== undefined) {
      (client as any).expiration_passeport = updateClientDto.expiration_passeport ? new Date(updateClientDto.expiration_passeport) : undefined;
    }
    if (updateClientDto.numero_mobile !== undefined) {
      (client as any).numero_mobile = updateClientDto.numero_mobile?.trim() || undefined;
    }
    if (updateClientDto.numero_mobile_2 !== undefined) {
      (client as any).numero_mobile_2 = updateClientDto.numero_mobile_2?.trim() || undefined;
    }
    if (updateClientDto.email !== undefined) {
      (client as any).email = updateClientDto.email?.trim() || undefined;
    }
    if (updateClientDto.date_naissance !== undefined) {
      (client as any).date_naissance = updateClientDto.date_naissance
        ? new Date(updateClientDto.date_naissance)
        : undefined;
    }
    if (updateClientDto.notes !== undefined) {
      (client as any).notes = updateClientDto.notes?.trim() || undefined;
    }
    if (updateClientDto.nom_entreprise !== undefined) {
      (client as any).nom_entreprise = updateClientDto.nom_entreprise?.trim() || undefined;
    }
    if (updateClientDto.rc !== undefined) {
      (client as any).rc = updateClientDto.rc?.trim() || undefined;
    }
    if (updateClientDto.nif !== undefined) {
      (client as any).nif = updateClientDto.nif?.trim() || undefined;
    }
    if (updateClientDto.ai !== undefined) {
      (client as any).ai = updateClientDto.ai?.trim() || undefined;
    }
    if (updateClientDto.nis !== undefined) {
      (client as any).nis = updateClientDto.nis?.trim() || undefined;
    }
    if (updateClientDto.prefere_facturation !== undefined) {
      (client as any).prefere_facturation = updateClientDto.prefere_facturation;
    }

    return this.clientRepository.save(client);
  }

  async remove(id: number): Promise<void> {
    const client = await this.findOne(id);
    await this.clientRepository.remove(client);
  }

  async importFromExcel(file: Express.Multer.File, user?: any): Promise<{ success: number; errors: string[] }> {
    const workbook = XLSX.read(file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet);

    const errors: string[] = [];
    let success = 0;

    for (let i = 0; i < data.length; i++) {
      const row = data[i] as any;
      const rowNumber = i + 2; // +2 because Excel is 1-indexed and we have headers

      try {
        // Map Excel columns to DTO fields
        // Expected columns: type_client, nom_complet, nom_entreprise, numero_mobile, numero_mobile_2, email, date_naissance, numero_passeport, expiration_passeport, rc, nif, ai, nis, notes, prefere_facturation
        const typeClient = (row.type_client || row['Type Client'] || 'Particulier').toString().trim();
        if (typeClient !== 'Particulier' && typeClient !== 'Entreprise') {
          errors.push(`Ligne ${rowNumber}: Type client invalide (doit être "Particulier" ou "Entreprise")`);
          continue;
        }

        // Helper function to safely convert to string and trim
        const safeString = (value: any): string | undefined => {
          if (value === undefined || value === null || value === '') return undefined;
          return String(value).trim() || undefined;
        };

        // Validate required fields based on client type
        const nomComplet = safeString(row.nom_complet || row['Nom Complet'] || row['Nom']);
        const nomEntreprise = safeString(row.nom_entreprise || row['Nom Entreprise'] || row['Entreprise']);

        if (typeClient === 'Particulier') {
          if (!nomComplet) {
            errors.push(`Ligne ${rowNumber}: Le nom complet (nom et prénom) est requis pour un particulier`);
            continue;
          }
        } else if (typeClient === 'Entreprise') {
          if (!nomEntreprise) {
            errors.push(`Ligne ${rowNumber}: Le nom de l'entreprise est requis pour une entreprise`);
            continue;
          }
        }

        const createClientDto: CreateClientDto = {
          type_client: typeClient === 'Particulier' ? ClientType.PARTICULIER : ClientType.ENTREPRISE,
          nom_complet: nomComplet,
          nom_entreprise: nomEntreprise,
          numero_mobile: safeString(row.numero_mobile || row['Numéro Mobile'] || row['Téléphone'] || row['Tel']),
          numero_mobile_2: safeString(row.numero_mobile_2 || row['Numéro Mobile 2'] || row['Téléphone 2'] || row['Tel 2']),
          email: safeString(row.email || row['Email'] || row['E-mail']),
          date_naissance: safeString(row.date_naissance || row['Date Naissance'] || row['Date de Naissance']),
          numero_passeport: safeString(row.numero_passeport || row['Numéro Passeport'] || row['Passeport']),
          expiration_passeport: safeString(row.expiration_passeport || row['Expiration Passeport'] || row['Date Expiration']),
          rc: safeString(row.rc || row['RC']),
          nif: safeString(row.nif || row['NIF']),
          ai: safeString(row.ai || row['AI']),
          nis: safeString(row.nis || row['NIS']),
          notes: safeString(row.notes || row['Notes'] || row['Remarques']),
          prefere_facturation: row.prefere_facturation === 'Oui' || row.prefere_facturation === 'oui' || row.prefere_facturation === true || row['Préfère Facturation'] === 'Oui' || false,
        };

        // Validate required fields
        if (createClientDto.type_client === 'Particulier' && !createClientDto.nom_complet) {
          errors.push(`Ligne ${rowNumber}: Nom complet requis pour un client Particulier`);
          continue;
        }

        if (createClientDto.type_client === 'Entreprise' && !createClientDto.nom_entreprise) {
          errors.push(`Ligne ${rowNumber}: Nom d'entreprise requis pour un client Entreprise`);
          continue;
        }

        await this.create(createClientDto, user);
        success++;
      } catch (error: any) {
        errors.push(`Ligne ${rowNumber}: ${error.message || 'Erreur lors de l\'importation'}`);
      }
    }

    return { success, errors };
  }
}


