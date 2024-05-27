import { Injectable, Logger } from '@nestjs/common';
import { Socket } from 'socket.io';
import { CommandDto } from './dtos/CommandDto';
import { PlatformCommandHandler } from './PlatformCommandHandler';

@Injectable()
export class PlatformService {

  private logger = new Logger(PlatformService.name);

  getPlatformHandler(): PlatformCommandHandler {
    throw new Error('Method not implemented. Use a subclass of PlatformCommandHandler instead.');
  }

  async handleCommandRequest(client: Socket, command: CommandDto) {
    const platformHandler = this.getPlatformHandler();
    const platformCommand = await platformHandler.preparePlatformCommand(client, command);
    this.logger.debug("SENDING Client command to Satellite Platform");
    platformHandler.sendPlatformMessage(platformCommand);
  } 
}
