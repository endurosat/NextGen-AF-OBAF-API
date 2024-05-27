import { Module } from '@nestjs/common';
import { ClientService } from './client.service';

@Module({
  imports: [],
  controllers: [],
  providers: [ClientService],
  exports: [ClientService]
})
export class ClientsModule {}
