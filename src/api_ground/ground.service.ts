import { Injectable } from '@nestjs/common';
import { Socket } from 'socket.io-client';
import { GroundCommandExecutor } from './GroundCommandExecutor';

@Injectable()
export class GroundService {

  private getGroundCommandExecutor(): GroundCommandExecutor {
    throw new Error('Method not implemented. Use a subclass of GroundCommandExecutor instead.');
  }

  async handleGroundCommand(client: Socket, command ) : Promise<any> {
    const executor = this.getGroundCommandExecutor();
    const responseCommand = executor.executePlatformCommand(client, command);
    return responseCommand;
  }
  
}
