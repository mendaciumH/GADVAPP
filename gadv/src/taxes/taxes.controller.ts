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
import { TaxesService } from './taxes.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/permissions.guard';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { CreateTaxeDto } from './dto/create-taxe.dto';
import { UpdateTaxeDto } from './dto/update-taxe.dto';


@Controller('admin/taxes')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Permissions('view_taxes', 'manage_taxes')
export class TaxesController {
  constructor(private readonly taxesService: TaxesService) { }

  @Get()
  async findAll() {
    return this.taxesService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.taxesService.findOne(id);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createTaxeDto: CreateTaxeDto, @Req() req) {
    return this.taxesService.create(createTaxeDto, req.user);
  }

  @Put(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateTaxeDto: UpdateTaxeDto,
    @Req() req,
  ) {
    return this.taxesService.update(id, updateTaxeDto, req.user);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    await this.taxesService.remove(id);
  }
}

