import { Module } from '@nestjs/common';
import { PlatformService } from './platform.service';
import { PlatformGateway } from './platform.gateway';

@Module({
  imports: [],
  controllers: [],
  providers: [PlatformService, PlatformGateway],
  exports: []
})
export class PlatformModule {}
