import { Module } from '@nestjs/common';
import { FPGAService } from './fpga.service';
import { FPGAGateway } from './fpga.gateway';

@Module({
  imports: [],
  controllers: [],
  providers: [FPGAService, FPGAGateway],
  exports: []
})
export class FPGAModule {}
