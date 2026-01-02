import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReductionsController } from './reductions.controller';
import { ReductionsService } from './reductions.service';
import { Reduction } from '../entities/reduction.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Reduction])],
  controllers: [ReductionsController],
  providers: [ReductionsService],
  exports: [ReductionsService],
})
export class ReductionsModule {}

