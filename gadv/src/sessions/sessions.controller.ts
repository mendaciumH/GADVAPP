import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Body,
  Param,
  ParseIntPipe,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  Req,
} from '@nestjs/common';
import { SessionsService } from './sessions.service';
import { CreateSessionDto } from './dto/create-session.dto';
import { UpdateSessionDto } from './dto/update-session.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/permissions.guard';
import { Permissions } from '../auth/decorators/permissions.decorator';


@Controller('admin/sessions')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Permissions('view_sessions', 'manage_sessions')
export class SessionsController {
  constructor(private readonly sessionsService: SessionsService) { }

  @Get()
  async findAll(@Query('articleId', ParseIntPipe) articleId?: number) {
    return this.sessionsService.findAll(articleId);
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.sessionsService.findOne(id);
  }

  @Get('article/:articleId')
  async findByArticleId(@Param('articleId', ParseIntPipe) articleId: number) {
    return this.sessionsService.findByArticleId(articleId);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createSessionDto: CreateSessionDto, @Req() req) {
    return this.sessionsService.create(createSessionDto, req.user);
  }

  @Put(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateSessionDto: UpdateSessionDto,
    @Req() req,
  ) {
    return this.sessionsService.update(id, updateSessionDto, req.user);
  }

  @Patch(':id')
  async patch(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateSessionDto: UpdateSessionDto,
    @Req() req,
  ) {
    return this.sessionsService.update(id, updateSessionDto, req.user);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    await this.sessionsService.remove(id);
  }
}

