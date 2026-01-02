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
  Req,
} from '@nestjs/common';
import { CaissesService } from './caisses.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/permissions.guard';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { CreateCaisseDto } from './dto/create-caisse.dto';
import { UpdateCaisseDto } from './dto/update-caisse.dto';

@Controller('admin/caisses')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Permissions('view_caisses', 'manage_caisses')
export class CaissesController {
  constructor(private readonly caissesService: CaissesService) { }

  @Get()
  @Permissions('view_caisses', 'manage_caisses', 'view_caisse_omra', 'manage_caisse_omra')
  async findAll(@Req() req) {
    return this.caissesService.findAll(req.user);
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.caissesService.findOne(id);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createCaisseDto: CreateCaisseDto, @Req() req) {
    return this.caissesService.create(createCaisseDto, req.user);
  }

  @Put(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateCaisseDto: UpdateCaisseDto,
    @Req() req,
  ) {
    return this.caissesService.update(id, updateCaisseDto, req.user);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    await this.caissesService.remove(id);
  }
}

