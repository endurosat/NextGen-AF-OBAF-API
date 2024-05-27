import { Logger, UseInterceptors } from '@nestjs/common';
import { SubscribeMessage, WebSocketGateway } from '@nestjs/websockets';
import { Socket } from 'socket.io';
import { JwtInterceptor } from 'src/auth/AuthInterceptor';
import { EVENT_EXECUTE, formatPublicKey } from 'src/util/utils';
import { PayloadService } from './payload.service';
import { PayloadCommandDto } from './dtos/PayloadCommandDto';
import * as jwt from 'jsonwebtoken';

@UseInterceptors(new JwtInterceptor())
@WebSocketGateway({
  namespace: 'payload',
  cors: {
    origin: '*'
  }
})
export class PayloadGateway {

  private logger = new Logger(PayloadGateway.name);
  
  constructor(private readonly payloadService: PayloadService) {}
      
  //receives commands from Docker Client Apps
  @SubscribeMessage(EVENT_EXECUTE)
  async handleMessage(client: Socket, command: PayloadCommandDto): Promise<void> {
    const clientId = this.getClientId(client);
    if(clientId == null){
      const msg = "No client ID found in JWT token";
      this.logger.error(msg);
      client.emit(EVENT_EXECUTE, { message: msg });
    }
    this.logger.debug("Payload Command - received for clientId " + clientId + " : " + JSON.stringify(command));
    const response = await this.payloadService.handlePayloadCommand(clientId, command);
    this.logger.debug("Payload Command - returned: " + JSON.stringify(response));
    if(response){
      client.emit(EVENT_EXECUTE, { message: response });
    }
  }

  private getClientId(client: Socket): string {
    const authorizationHeader = client.handshake.headers.authorization;
    
    let jwtToken = authorizationHeader?.split(' ')[1];//remove "Bearer"

    if (!jwtToken) {
      return null;
    }
    let decodedToken;
    try {
      const publicKey = formatPublicKey(process.env.JWT_PUBLIC_KEY);
      decodedToken  = jwt.verify(jwtToken, publicKey, { algorithm: 'RS256' });
    } catch (error) {
      return null;
    }
    return decodedToken.clientId;
  }
}
