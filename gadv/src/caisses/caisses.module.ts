import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CaissesService } from './caisses.service';
import { CaissesController } from './caisses.controller';
import { Caisse } from '../entities/caisse.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Caisse])],
  controllers: [CaissesController],
  providers: [CaissesService],
  exports: [CaissesService],
})
export class CaissesModule {}

