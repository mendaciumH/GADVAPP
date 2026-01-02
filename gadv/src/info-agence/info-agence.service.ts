import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InfoAgence } from '../entities/info-agence.entity';
import { CreateInfoAgenceDto } from './dto/create-info-agence.dto';
import { UpdateInfoAgenceDto } from './dto/update-info-agence.dto';
import { FileUrlHelper } from '../common/utils/file-url.helper';

@Injectable()
export class InfoAgenceService {
  constructor(
    @InjectRepository(InfoAgence)
    private infoAgenceRepository: Repository<InfoAgence>,
  ) {}

  private getLogoUrl(logoFilename: string | null): string | null {
    // Return just the filename, let frontend construct the full URL
    return logoFilename;
  }

  private transformLogo(logo: string | null): string | null {
    return FileUrlHelper.extractFilename(logo);
  }

  async findAll(): Promise<InfoAgence[]> {
    const infoAgenceList = await this.infoAgenceRepository.find({
      order: { id: 'ASC' },
    });
    // Transform logo to return just filename
    return infoAgenceList.map(info => ({
      ...info,
      logo: this.getLogoUrl(info.logo) || undefined,
    })) as InfoAgence[];
  }

  async findOne(id: number): Promise<InfoAgence> {
    const infoAgence = await this.infoAgenceRepository.findOne({
      where: { id },
    });

    if (!infoAgence) {
      throw new NotFoundException(`InfoAgence with ID ${id} not found`);
    }

    // Transform logo to return just filename
    const logo = this.getLogoUrl(infoAgence.logo);
    return {
      ...infoAgence,
      logo: logo || undefined,
    } as InfoAgence;
  }

  async create(createInfoAgenceDto: CreateInfoAgenceDto): Promise<InfoAgence> {
    // Check if info-agence already exists (only one allowed)
    const existing = await this.infoAgenceRepository.find({ take: 1 });
    if (existing && existing.length > 0) {
      throw new BadRequestException('Info-agence déjà existante. Veuillez utiliser la mise à jour.');
    }

    // Transform logo to store just filename (extract from path if needed)
    const logoFilename = createInfoAgenceDto.logo 
      ? this.transformLogo(createInfoAgenceDto.logo.trim()) || undefined
      : undefined;

    // Validate nom_agence is not empty after trimming
    const trimmedNomAgence = createInfoAgenceDto.nom_agence.trim();
    if (!trimmedNomAgence || trimmedNomAgence.length === 0) {
      throw new BadRequestException('Le nom de l\'agence est requis');
    }

    const infoAgence = this.infoAgenceRepository.create({
      nom_agence: trimmedNomAgence,
      tel: createInfoAgenceDto.tel?.trim() || undefined,
      email: createInfoAgenceDto.email?.trim() || undefined,
      adresse: createInfoAgenceDto.adresse?.trim() || undefined,
      site_web: createInfoAgenceDto.site_web?.trim() || undefined,
      code_iata: createInfoAgenceDto.code_iata?.trim() || undefined,
      logo: logoFilename,
      prefix_factures: createInfoAgenceDto.prefix_factures?.trim() || undefined,
      pied_facture: createInfoAgenceDto.pied_facture?.trim() || undefined,
      fax: createInfoAgenceDto.fax?.trim() || undefined,
      n_licence: createInfoAgenceDto.n_licence?.trim() || undefined,
      n_rc: createInfoAgenceDto.n_rc?.trim() || undefined,
      ar: createInfoAgenceDto.ar?.trim() || undefined,
      nis: createInfoAgenceDto.nis?.trim() || undefined,
      nif: createInfoAgenceDto.nif?.trim() || undefined,
      rib: createInfoAgenceDto.rib?.trim() || undefined,
    });

    const saved = await this.infoAgenceRepository.save(infoAgence);
    
    // Return with transformed logo (just filename)
    return {
      ...saved,
      logo: this.getLogoUrl(saved.logo) || undefined,
    } as InfoAgence;
  }

  async update(
    id: number,
    updateInfoAgenceDto: UpdateInfoAgenceDto,
  ): Promise<InfoAgence> {
    const infoAgence = await this.findOne(id);

    const logoFilename = updateInfoAgenceDto.logo !== undefined
      ? (updateInfoAgenceDto.logo ? this.transformLogo(updateInfoAgenceDto.logo.trim()) || undefined : undefined)
      : undefined;

    if (updateInfoAgenceDto.nom_agence !== undefined) {
      const trimmedNomAgence = updateInfoAgenceDto.nom_agence.trim();
      if (!trimmedNomAgence || trimmedNomAgence.length === 0) {
        throw new BadRequestException('Le nom de l\'agence est requis');
      }
      infoAgence.nom_agence = trimmedNomAgence;
    }
    if (updateInfoAgenceDto.tel !== undefined) {
      (infoAgence as any).tel = updateInfoAgenceDto.tel?.trim() || undefined;
    }
    if (updateInfoAgenceDto.email !== undefined) {
      (infoAgence as any).email = updateInfoAgenceDto.email?.trim() || undefined;
    }
    if (updateInfoAgenceDto.adresse !== undefined) {
      (infoAgence as any).adresse = updateInfoAgenceDto.adresse?.trim() || undefined;
    }
    if (updateInfoAgenceDto.site_web !== undefined) {
      (infoAgence as any).site_web = updateInfoAgenceDto.site_web?.trim() || undefined;
    }
    if (updateInfoAgenceDto.code_iata !== undefined) {
      (infoAgence as any).code_iata = updateInfoAgenceDto.code_iata?.trim() || undefined;
    }
    if (logoFilename !== undefined) {
      (infoAgence as any).logo = logoFilename;
    }
    if (updateInfoAgenceDto.prefix_factures !== undefined) {
      (infoAgence as any).prefix_factures = updateInfoAgenceDto.prefix_factures?.trim() || undefined;
    }
    if (updateInfoAgenceDto.pied_facture !== undefined) {
      (infoAgence as any).pied_facture = updateInfoAgenceDto.pied_facture?.trim() || undefined;
    }
    if (updateInfoAgenceDto.fax !== undefined) {
      (infoAgence as any).fax = updateInfoAgenceDto.fax?.trim() || undefined;
    }
    if (updateInfoAgenceDto.n_licence !== undefined) {
      (infoAgence as any).n_licence = updateInfoAgenceDto.n_licence?.trim() || undefined;
    }
    if (updateInfoAgenceDto.n_rc !== undefined) {
      (infoAgence as any).n_rc = updateInfoAgenceDto.n_rc?.trim() || undefined;
    }
    if (updateInfoAgenceDto.ar !== undefined) {
      (infoAgence as any).ar = updateInfoAgenceDto.ar?.trim() || undefined;
    }
    if (updateInfoAgenceDto.nis !== undefined) {
      (infoAgence as any).nis = updateInfoAgenceDto.nis?.trim() || undefined;
    }
    if (updateInfoAgenceDto.nif !== undefined) {
      (infoAgence as any).nif = updateInfoAgenceDto.nif?.trim() || undefined;
    }
    if (updateInfoAgenceDto.rib !== undefined) {
      (infoAgence as any).rib = updateInfoAgenceDto.rib?.trim() || undefined;
    }

    const saved = await this.infoAgenceRepository.save(infoAgence);
    
    // Return with transformed logo (just filename)
    return {
      ...saved,
      logo: this.getLogoUrl(saved.logo) || undefined,
    } as InfoAgence;
  }

  async remove(id: number): Promise<void> {
    const infoAgence = await this.findOne(id);
    await this.infoAgenceRepository.remove(infoAgence);
  }
}

