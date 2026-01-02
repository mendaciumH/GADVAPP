import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TaxesController } from './taxes.controller';
import { TaxesService } from './taxes.service';
import { Taxe } from '../entities/taxe.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Taxe])],
  controllers: [TaxesController],
  providers: [TaxesService],
  exports: [TaxesService],
})
export class TaxesModule {}

