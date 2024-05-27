import { SubscribeMessage, WebSocketGateway } from '@nestjs/websockets';
import { Socket } from 'socket.io-client';
import { Logger } from '@nestjs/common';
import { GroundService } from './ground.service';
import { EVENT_EXECUTE } from 'src/util/utils';

@WebSocketGateway({
  namespace: 'ground',
  cors: {
    origin: '*'
  }
})
export class GroundGateway {

  private logger = new Logger(GroundGateway.name);
  
  constructor(private readonly groundService: GroundService) {}
      
  //receives commands from Ground station through GSS. Only used through GSAF OBAF Handler. Not for production
  @SubscribeMessage(EVENT_EXECUTE)
  async handleMessage(client: Socket, command): Promise<void> {
    this.logger.debug("Ground Command - received: " + JSON.stringify(command));
    const response = await this.groundService.handleGroundCommand(client, command);
    this.logger.debug("Ground Command - returned: " + JSON.stringify(response));
    if(response){
      client.emit(EVENT_EXECUTE, { message: response });
    }
  }
}
