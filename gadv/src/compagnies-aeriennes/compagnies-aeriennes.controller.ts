import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  ParseIntPipe,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { CompagniesAeriennesService } from './compagnies-aeriennes.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/permissions.guard';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { CreateCompagnieAerienneDto } from './dto/create-compagnie-aerienne.dto';
import { UpdateCompagnieAerienneDto } from './dto/update-compagnie-aerienne.dto';


@Controller('admin/compagnies-aeriennes')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Permissions('view_compagnies_aeriennes', 'manage_compagnies_aeriennes')
export class CompagniesAeriennesController {
  constructor(private readonly compagniesAeriennesService: CompagniesAeriennesService) { }

  @Get()
  async findAll() {
    return this.compagniesAeriennesService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.compagniesAeriennesService.findOne(id);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createCompagnieDto: CreateCompagnieAerienneDto) {
    return this.compagniesAeriennesService.create(createCompagnieDto);
  }

  @Put(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateCompagnieDto: UpdateCompagnieAerienneDto,
  ) {
    return this.compagniesAeriennesService.update(id, updateCompagnieDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    await this.compagniesAeriennesService.remove(id);
  }
}

