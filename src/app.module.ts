import { Module } from '@nestjs/common';
import { ClientsModule } from './clients/clients.module';
import { GroundModule } from './api_ground/ground.module';
import { PlatformModule } from './api_platform/platform.module';
import { PayloadModule } from './api_payload/payload.module';
import { FPGAModule } from './api_fpga/fpga.module';

@Module({
  imports: [
    ClientsModule,
    GroundModule,
    PlatformModule,
    PayloadModule,
    FPGAModule
  ],
  providers: [],
})
export class AppModule {}
