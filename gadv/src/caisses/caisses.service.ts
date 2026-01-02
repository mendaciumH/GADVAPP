import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Caisse } from '../entities/caisse.entity';
import { CreateCaisseDto } from './dto/create-caisse.dto';
import { UpdateCaisseDto } from './dto/update-caisse.dto';

@Injectable()
export class CaissesService {
  constructor(
    @InjectRepository(Caisse)
    private caissesRepository: Repository<Caisse>,
  ) { }

  async findAll(user?: any): Promise<Caisse[]> {
    // Permission Logic
    if (user) {
      const permissions: string[] = user.permissions || [];
      const roles: string[] = user.roles || [];
      const isAdmin = roles.some((r: string) => r.toLowerCase().includes('admin'));

      const hasGlobalAccess = isAdmin || permissions.includes('view_caisses') || permissions.includes('manage_caisses');
      const hasOmraAccess = permissions.includes('view_caisse_omra') || permissions.includes('manage_caisse_omra');

      if (hasGlobalAccess) {
        // Return all
        return this.caissesRepository.find({
          order: { is_principale: 'DESC', created_at: 'DESC' },
        });
      } else if (hasOmraAccess) {
        // Return only Caisse Omra (ID 2)
        return this.caissesRepository.find({
          where: { id: 2 },
          order: { is_principale: 'DESC', created_at: 'DESC' },
        });
      } else {
        return [];
      }
    }

    return this.caissesRepository.find({
      order: { is_principale: 'DESC', created_at: 'DESC' },
    });
  }

  async findOne(id: number): Promise<Caisse> {
    const caisse = await this.caissesRepository.findOne({
      where: { id },
    });

    if (!caisse) {
      throw new NotFoundException(`Caisse with ID ${id} not found`);
    }

    return caisse;
  }

  async create(createCaisseDto: CreateCaisseDto, user?: any): Promise<Caisse> {
    const nomCaisseTrimmed = createCaisseDto.nom_caisse.trim();

    // Check if a caisse with the same name already exists
    const existingCaisse = await this.caissesRepository.findOne({
      where: { nom_caisse: nomCaisseTrimmed },
    });

    if (existingCaisse) {
      throw new BadRequestException(`Une caisse avec le nom "${nomCaisseTrimmed}" existe déjà`);
    }

    // Check if trying to create another principale caisse
    if (createCaisseDto.is_principale) {
      const existingPrincipale = await this.caissesRepository.findOne({
        where: { is_principale: true },
      });

      if (existingPrincipale) {
        throw new BadRequestException('Une caisse principale existe déjà');
      }
    }

    const caisse = this.caissesRepository.create({
      nom_caisse: nomCaisseTrimmed,
      montant_depart: createCaisseDto.montant_depart ?? 0,
      solde_actuel: createCaisseDto.solde_actuel ?? createCaisseDto.montant_depart ?? 0,
      devise: createCaisseDto.devise || 'DZD',
      is_principale: createCaisseDto.is_principale ?? false,
      user_id: user?.id,
    });

    return this.caissesRepository.save(caisse);
  }

  async update(id: number, updateCaisseDto: UpdateCaisseDto, user?: any): Promise<Caisse> {
    const caisse = await this.findOne(id);

    // Check if trying to update to a name that already exists
    if (updateCaisseDto.nom_caisse !== undefined) {
      const nomCaisseTrimmed = updateCaisseDto.nom_caisse.trim();
      const existingCaisse = await this.caissesRepository.findOne({
        where: { nom_caisse: nomCaisseTrimmed },
      });

      if (existingCaisse && existingCaisse.id !== id) {
        throw new BadRequestException(`Une caisse avec le nom "${nomCaisseTrimmed}" existe déjà`);
      }
    }

    // Prevent changing is_principale if another principale exists
    if (updateCaisseDto.is_principale !== undefined && updateCaisseDto.is_principale && !caisse.is_principale) {
      const existingPrincipale = await this.caissesRepository.findOne({
        where: { is_principale: true },
      });

      if (existingPrincipale && existingPrincipale.id !== id) {
        throw new BadRequestException('Une caisse principale existe déjà');
      }
    }

    // Prevent deleting principale status
    if (updateCaisseDto.is_principale === false && caisse.is_principale) {
      throw new BadRequestException('Impossible de retirer le statut de caisse principale');
    }

    if (updateCaisseDto.nom_caisse !== undefined) {
      caisse.nom_caisse = updateCaisseDto.nom_caisse.trim();
    }

    if (updateCaisseDto.montant_depart !== undefined) {
      caisse.montant_depart = updateCaisseDto.montant_depart;
    }

    if (updateCaisseDto.solde_actuel !== undefined) {
      caisse.solde_actuel = updateCaisseDto.solde_actuel;
    }

    if (updateCaisseDto.devise !== undefined) {
      caisse.devise = updateCaisseDto.devise;
    }

    if (updateCaisseDto.is_principale !== undefined) {
      caisse.is_principale = updateCaisseDto.is_principale;
    }

    caisse.updated_at = new Date();
    caisse.user_id = user?.id;

    return this.caissesRepository.save(caisse);
  }

  async remove(id: number): Promise<void> {
    const caisse = await this.findOne(id);

    if (caisse.is_principale) {
      throw new BadRequestException('Impossible de supprimer la caisse principale');
    }

    await this.caissesRepository.remove(caisse);
  }
}

