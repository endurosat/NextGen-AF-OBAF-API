import { Logger, UseInterceptors } from '@nestjs/common';
import { SubscribeMessage, WebSocketGateway } from '@nestjs/websockets';
import { Socket } from 'socket.io';
import { JwtInterceptor } from 'src/auth/AuthInterceptor';
import { EVENT_EXECUTE } from 'src/util/utils';
import { FPGAService } from './fpga.service';
import { FPGACommandDto } from './dtos/FPGACommandDto';

@UseInterceptors(new JwtInterceptor())
@WebSocketGateway({
  namespace: 'fpga',
  cors: {
    origin: '*'
  }
})
export class FPGAGateway {

  private logger = new Logger(FPGAGateway.name);
  
  constructor(private readonly fpgaService: FPGAService) {}
      
  //receives commands from Docker Client Apps
  @SubscribeMessage(EVENT_EXECUTE)
  async handleMessage(client: Socket, command: FPGACommandDto): Promise<void> {
    if(typeof command === 'string'){
      command = JSON.parse(command);
    }
    this.logger.debug("FPGA Command - received: " + JSON.stringify(command));
    const response = await this.fpgaService.handleFPGACommand(command);
    this.logger.debug("FPGA Command - returned: " + JSON.stringify(response));
    if(response){
      client.emit(EVENT_EXECUTE, { message: response });
    }
  }
}
