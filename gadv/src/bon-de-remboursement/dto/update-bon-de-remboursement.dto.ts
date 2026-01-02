import { PartialType } from '@nestjs/mapped-types';
import { CreateBonDeRemboursementDto } from './create-bon-de-remboursement.dto';

export class UpdateBonDeRemboursementDto extends PartialType(CreateBonDeRemboursementDto) { }
