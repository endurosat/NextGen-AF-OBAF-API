import { UseInterceptors } from '@nestjs/common';
import { SubscribeMessage, WebSocketGateway } from '@nestjs/websockets';
import { Socket } from 'socket.io';
import { JwtInterceptor } from 'src/auth/AuthInterceptor';
import { PlatformService as ESPSService } from './platform.service';
import { EVENT_EXECUTE } from 'src/util/utils';
import { CommandDto } from './dtos/CommandDto';

@UseInterceptors(new JwtInterceptor())
@WebSocketGateway({
  namespace: 'platform',
  cors: {
    origin: '*'
  }
})
export class PlatformGateway {
  
  constructor(private readonly espsService: ESPSService) {}
      
  //receives commands from Docker Client Apps
  @SubscribeMessage(EVENT_EXECUTE)
  async handleMessage(client: Socket, command: CommandDto): Promise<void> {
    this.espsService.handleCommandRequest(client, command);
  }
}
