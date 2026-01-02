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
import { ReductionsService } from './reductions.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/permissions.guard';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { CreateReductionDto } from './dto/create-reduction.dto';
import { UpdateReductionDto } from './dto/update-reduction.dto';


@Controller('admin/reductions')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Permissions('view_reductions', 'manage_reductions')
export class ReductionsController {
  constructor(private readonly reductionsService: ReductionsService) { }

  @Get()
  async findAll() {
    return this.reductionsService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.reductionsService.findOne(id);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createReductionDto: CreateReductionDto, @Req() req) {
    return this.reductionsService.create(createReductionDto, req.user);
  }

  @Put(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateReductionDto: UpdateReductionDto,
    @Req() req,
  ) {
    return this.reductionsService.update(id, updateReductionDto, req.user);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    await this.reductionsService.remove(id);
  }
}

