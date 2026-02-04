import { Controller } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import { CreateFixService, GetAllServicesRequest, GetServicesResponse, ListByTechRequest, UpdateFixService } from 'src/common/dto/fixService.dto';
import { Types } from 'mongoose';
import { FixServicesService } from 'src/grpc/services/fixService.service';
import { Const_GRPC_FixService, ConstGRPC } from 'src/common/utils/Const';
import { FixService } from 'src/common/schema/fixService.schema';

@Controller()
export class FixServicesController {
  constructor(private readonly servicesService: FixServicesService) {}

  @GrpcMethod(ConstGRPC.FIX_SERVICE_SERVICE, Const_GRPC_FixService.Create)
  Create(data: { service: CreateFixService; userId: string }): Promise<{ service: FixService }> {
    return this.servicesService.create(data.service, data.userId);
  }

  @GrpcMethod(ConstGRPC.FIX_SERVICE_SERVICE, Const_GRPC_FixService.Update)
  Update(data: { id: string; update: UpdateFixService; userId: string }): Promise<{ service: FixService }> {
    return this.servicesService.update(new Types.ObjectId(data.id), data.update, data.userId);
  }

  @GrpcMethod(ConstGRPC.FIX_SERVICE_SERVICE, Const_GRPC_FixService.GetServiceById)
  GetServiceById(data: { id: string; userId: string }): Promise<{ service: object }> {
    return this.servicesService.getServiceById(new Types.ObjectId(data.id), data.userId);
  }

  @GrpcMethod(ConstGRPC.FIX_SERVICE_SERVICE, Const_GRPC_FixService.GetServicesByServiceAdminId)
  GetServicesByServiceAdminId(data: { serviceAdminId: number; isActive: boolean; userId: string }): Promise<{ data: object[] }> {
    return this.servicesService.getServicesByServiceAdminId(Number(data.serviceAdminId), data.isActive, data.userId);
  }

  @GrpcMethod(ConstGRPC.FIX_SERVICE_SERVICE, Const_GRPC_FixService.ListByTech)
  ListByTech(data: ListByTechRequest): Promise<GetServicesResponse> {
    return this.servicesService.listByTech(new Types.ObjectId(data.techId), data.userId);
  }

  @GrpcMethod(ConstGRPC.FIX_SERVICE_SERVICE, Const_GRPC_FixService.GetAllServices)
  GetAllServices(data: GetAllServicesRequest): Promise<GetServicesResponse> {
    return this.servicesService.getAllServices(data.queries.limit, data.queries.skip, data.queries.needTimestamp, data.queries.sort);
  }

  @GrpcMethod(ConstGRPC.FIX_SERVICE_SERVICE, Const_GRPC_FixService.Delete)
  async removeByAdmin(data: { id: string }): Promise<void> {
    return await this.servicesService.delete(new Types.ObjectId(data.id));
  }
}
