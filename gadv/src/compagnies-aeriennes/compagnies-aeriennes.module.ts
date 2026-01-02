import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CompagniesAeriennesService } from './compagnies-aeriennes.service';
import { CompagniesAeriennesController } from './compagnies-aeriennes.controller';
import { CompagnieAerienne } from '../entities/compagnie-aerienne.entity';

@Module({
  imports: [TypeOrmModule.forFeature([CompagnieAerienne])],
  controllers: [CompagniesAeriennesController],
  providers: [CompagniesAeriennesService],
  exports: [CompagniesAeriennesService],
})
export class CompagniesAeriennesModule {}

