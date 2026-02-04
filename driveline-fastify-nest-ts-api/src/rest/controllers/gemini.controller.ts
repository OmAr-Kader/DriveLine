import { Controller, Post, Body, Headers, UseGuards, HttpException, HttpStatus } from '@nestjs/common';
import { CreateGeminiDto } from 'src/common/dto/gemini.dto';
import { PublicApi } from 'src/rest/flow-control/decorators/priority.decorator';
import { Const } from 'src/common/utils/Const';
import { ApiKeyGuard } from 'src/common/utils/verification';
import { JwtAuthGuard } from 'src/common/utils/verifyJWTtoken';
import { GrpcClientService } from '../services/grpc-client.service';

@Controller('service')
@UseGuards(ApiKeyGuard, JwtAuthGuard)
export class GeminiController {
  constructor(private readonly grpc: GrpcClientService) {}

  @Post('gemini')
  @PublicApi()
  async generateWorkerNew(@Body() body: CreateGeminiDto, @Headers(Const.UserID) userId: string): Promise<object> {
    try {
      return await this.grpc.runThisServiceOnce(this.grpc.gemini.GenerateContent({ data: body, userId }));
    } catch (error) {
      throw new HttpException((error as Error).message || 'Failed to generate content', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}
