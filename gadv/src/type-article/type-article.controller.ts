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
import { TypeArticleService } from './type-article.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/permissions.guard';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { CreateTypeArticleDto } from './dto/create-type-article.dto';
import { UpdateTypeArticleDto } from './dto/update-type-article.dto';


@Controller('admin/type-article')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Permissions('view_type_article', 'manage_type_article')
export class TypeArticleController {
  constructor(private readonly typeArticleService: TypeArticleService) { }

  @Get()
  async findAll() {
    return this.typeArticleService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.typeArticleService.findOne(id);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createTypeArticleDto: CreateTypeArticleDto) {
    return this.typeArticleService.create(createTypeArticleDto);
  }

  @Put(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateTypeArticleDto: UpdateTypeArticleDto,
  ) {
    return this.typeArticleService.update(id, updateTypeArticleDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    await this.typeArticleService.remove(id);
  }
}

