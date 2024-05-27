import { Module } from '@nestjs/common';
import { GroundService } from './ground.service';
import { GroundGateway } from './ground.gateway';
import { GroundCommandFactory } from './groundCommands/GroundCommandsFactory';
import { ClientsModule } from 'src/clients/clients.module';

@Module({
  imports: [ClientsModule],
  controllers: [],
  providers: [GroundService, GroundGateway, GroundCommandFactory],
  exports: [GroundService]
})
export class GroundModule {}
