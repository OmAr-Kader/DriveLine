import { Module, Global } from '@nestjs/common';
import { ClickHouseService } from './clickhouse.service';
import { ClickHouseController } from './clickHouse.controller';

@Global()
@Module({
  providers: [ClickHouseService],
  controllers: [ClickHouseController],
  exports: [ClickHouseService],
})
export class ClickHouseModule {}
