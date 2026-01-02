import { Controller, Get, Body, Put, Param, ParseIntPipe, UseGuards } from '@nestjs/common';
import { NumerotationsService } from './numerotations.service';
import { Numerotation } from '../entities/numerotation.entity';
// Assuming AuthGuard logic exists, import it if needed. For now keeping it simple as per other controllers
// import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
// import { RolesGuard } from '../auth/guards/roles.guard';
// import { Roles } from '../auth/decorators/roles.decorator';

@Controller('numerotations')
// @UseGuards(JwtAuthGuard, RolesGuard)
export class NumerotationsController {
    constructor(private readonly numerotationsService: NumerotationsService) { }

    @Get()
    // @Roles('admin')
    findAll() {
        return this.numerotationsService.findAll();
    }

    @Put(':id')
    // @Roles('admin')
    update(
        @Param('id', ParseIntPipe) id: number,
        @Body() updateData: Partial<Numerotation>,
    ) {
        return this.numerotationsService.update(id, updateData);
    }

    @Get('preview/:type')
    async getPreview(@Param('type') type: string) {
        const numero = await this.numerotationsService.getPreviewNumber(type as any);
        return { numero };
    }
}
