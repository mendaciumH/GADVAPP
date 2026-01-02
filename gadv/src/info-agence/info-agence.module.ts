import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InfoAgenceController } from './info-agence.controller';
import { InfoAgenceService } from './info-agence.service';
import { InfoAgence } from '../entities/info-agence.entity';

@Module({
  imports: [TypeOrmModule.forFeature([InfoAgence])],
  controllers: [InfoAgenceController],
  providers: [InfoAgenceService],
  exports: [InfoAgenceService],
})
export class InfoAgenceModule {}

