import { Module } from '@nestjs/common';
import { PayloadService } from './payload.service';
import { PayloadGateway } from './payload.gateway';

@Module({
  imports: [],
  controllers: [],
  providers: [PayloadService, PayloadGateway],
  exports: []
})
export class PayloadModule {}
