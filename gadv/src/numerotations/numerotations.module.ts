import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Numerotation } from '../entities/numerotation.entity';
import { NumerotationsService } from './numerotations.service';
import { NumerotationsController } from './numerotations.controller';

@Module({
    imports: [TypeOrmModule.forFeature([Numerotation])],
    controllers: [NumerotationsController],
    providers: [NumerotationsService],
    exports: [NumerotationsService],
})
export class NumerotationsModule { }
