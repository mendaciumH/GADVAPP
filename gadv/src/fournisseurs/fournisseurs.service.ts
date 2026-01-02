import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Fournisseur } from '../entities/fournisseur.entity';
import { CreateFournisseurDto } from './dto/create-fournisseur.dto';
import { UpdateFournisseurDto } from './dto/update-fournisseur.dto';
const XLSX = require('xlsx');

@Injectable()
export class FournisseursService {
  constructor(
    @InjectRepository(Fournisseur)
    private fournisseurRepository: Repository<Fournisseur>,
  ) { }

  async findAll(): Promise<Fournisseur[]> {
    return this.fournisseurRepository.find({
      order: { id: 'DESC' },
    });
  }

  async findOne(id: number): Promise<Fournisseur> {
    const fournisseur = await this.fournisseurRepository.findOne({
      where: { id },
    });

    if (!fournisseur) {
      throw new NotFoundException(`Fournisseur with ID ${id} not found`);
    }

    return fournisseur;
  }

  async create(createFournisseurDto: CreateFournisseurDto, user?: any): Promise<Fournisseur> {
    const fournisseur = this.fournisseurRepository.create({
      nom_complet: createFournisseurDto.nom_complet.trim(),
      numero_mobile: createFournisseurDto.numero_mobile?.trim() || undefined,
      notes: createFournisseurDto.notes?.trim() || undefined,
      credit_depart: createFournisseurDto.credit_depart || undefined,
      user_id: user?.id,
    });

    return this.fournisseurRepository.save(fournisseur);
  }

  async update(
    id: number,
    updateFournisseurDto: UpdateFournisseurDto,
  ): Promise<Fournisseur> {
    const fournisseur = await this.findOne(id);

    if (updateFournisseurDto.nom_complet !== undefined) {
      fournisseur.nom_complet = updateFournisseurDto.nom_complet.trim();
    }
    if (updateFournisseurDto.numero_mobile !== undefined) {
      (fournisseur as any).numero_mobile = updateFournisseurDto.numero_mobile?.trim() || undefined;
    }
    if (updateFournisseurDto.notes !== undefined) {
      (fournisseur as any).notes = updateFournisseurDto.notes?.trim() || undefined;
    }
    if (updateFournisseurDto.credit_depart !== undefined) {
      (fournisseur as any).credit_depart = updateFournisseurDto.credit_depart || undefined;
    }

    return this.fournisseurRepository.save(fournisseur);
  }

  async remove(id: number): Promise<void> {
    const fournisseur = await this.findOne(id);
    await this.fournisseurRepository.remove(fournisseur);
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
        // Expected columns: nom_complet, numero_mobile, notes, credit_depart
        const nomComplet = row.nom_complet || row['Nom Complet'] || row['Nom'] || row['Fournisseur'] || '';
        const numeroMobile = row.numero_mobile || row['Numéro Mobile'] || row['Téléphone'] || row['Tel'] || undefined;
        const notes = row.notes || row['Notes'] || row['Remarques'] || undefined;
        const creditDepart = row.credit_depart || row['Crédit Départ'] || row['Crédit'] || undefined;

        const createFournisseurDto: CreateFournisseurDto = {
          nom_complet: String(nomComplet || '').trim(),
          numero_mobile: numeroMobile ? String(numeroMobile).trim() : undefined,
          notes: notes ? String(notes).trim() : undefined,
          credit_depart: creditDepart !== undefined && creditDepart !== null && creditDepart !== '' ? parseFloat(String(creditDepart)) : undefined,
        };

        // Validate required fields
        if (!createFournisseurDto.nom_complet || createFournisseurDto.nom_complet.trim() === '') {
          errors.push(`Ligne ${rowNumber}: Nom complet requis`);
          continue;
        }

        await this.create(createFournisseurDto, user);
        success++;
      } catch (error: any) {
        errors.push(`Ligne ${rowNumber}: ${error.message || 'Erreur lors de l\'importation'}`);
      }
    }

    return { success, errors };
  }
}


