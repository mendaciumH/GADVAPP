import { PartialType } from '@nestjs/mapped-types';
import { CreateBonDeVersementDto } from './create-bon-de-versement.dto';

export class UpdateBonDeVersementDto extends PartialType(CreateBonDeVersementDto) {}

