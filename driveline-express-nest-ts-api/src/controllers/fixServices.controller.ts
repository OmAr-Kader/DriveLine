import { Controller, Get, Post, Patch, Body, Param, Query, BadRequestException, UseGuards } from '@nestjs/common';
import { CreateFixServiceDto, UpdateFixServiceDto } from 'src/dto/create.FixService.dto';
import { Types } from 'mongoose';
import { FixServicesService } from 'src/services/fixService.service';
import { ApiKeyGuard } from 'src/utils/verification';
import { JwtAuthGuard } from 'src/utils/verifyJWTtoken';

@Controller('fix-services')
@UseGuards(JwtAuthGuard, ApiKeyGuard)
export class FixServicesController {
  constructor(private readonly servicesService: FixServicesService) {}

  @Post('services')
  create(@Body() dto: CreateFixServiceDto) {
    return this.servicesService.create(dto);
  }

  @Patch('services/:id')
  update(@Param('id') id: string, @Body() dto: UpdateFixServiceDto) {
    if (!id || !Types.ObjectId.isValid(id)) throw new BadRequestException('Invalid id');
    return this.servicesService.update(new Types.ObjectId(id), dto);
  }

  @Get('services/:id')
  getOne(@Param('id') id: string) {
    if (!id || !Types.ObjectId.isValid(id)) throw new BadRequestException('Invalid id');
    return this.servicesService.getServiceById(new Types.ObjectId(id));
  }

  @Get('services')
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  list(@Query('serviceAdminId') serviceAdminId: number, @Query('isActive') isActive: string, @Query('page') page = 1, @Query('limit') limit = 20) {
    if (!serviceAdminId || !isActive) throw new BadRequestException('Invalid data');
    return this.servicesService.getServicesByServiceAdminId(Number(serviceAdminId), isActive === 'true');
  }

  @Get('tech/:techId/services')
  getTechServices(@Param('techId') techId: string) {
    if (!techId || !Types.ObjectId.isValid(techId)) throw new BadRequestException('Invalid id');
    return this.servicesService.listByTech(new Types.ObjectId(techId));
  }
}
