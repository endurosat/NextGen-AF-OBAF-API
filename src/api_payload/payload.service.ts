import { Injectable, Logger } from '@nestjs/common';
import { CLIENT_PAYLOAD_FOLDER, generateId, getHostPayloadFolder } from 'src/util/utils';
import { PayloadCommandDto } from './dtos/PayloadCommandDto';
import { PayloadCommandResultDto } from './dtos/PayloadCommandResultDto';
import { PendingPayloadCommandDto } from './dtos/PendingPayloadCommandDto';
import * as WebSocket from 'ws';
import * as path from 'path';

const RECONNECT_DELAY = 5000;

@Injectable()
export class PayloadService {
  private logger = new Logger(PayloadService.name);
  private payloadSocket : WebSocket;
  //command id -> command data
  private pendingCommands = new Map<number, PendingPayloadCommandDto>();

  constructor() {
    this.connect();
  }

  listen(){
    this.payloadSocket.onmessage = (e) => {
      let json = JSON.parse(e.data);
      this.receivePayloadMessage(json)
      if (json.type == "Error") {
        this.logger.error("Payload API Result Error: " + JSON.stringify(json));
      }
    };
  }

  connect(){
    const hostIp = process.env.PAYLOAD_API_HOST || "localhost";
    const hostPort = process.env.PAYLOAD_API_PORT || "8081";

    const connectToPayload = () => {
        this.logger.log("Connecting to Payload API at " + hostIp);

        this.payloadSocket = new WebSocket('ws://' + hostIp + ':' + hostPort,{});

        this.payloadSocket.on('open', () => {
            this.logger.log('Connected to Payload API WebSocket server');
            clearTimeout(reconnectTimeout);
            this.listen();
        });

        this.payloadSocket.on('close', () => {
            this.logger.log('Disconnected from Payload API WebSocket server');
            scheduleReconnect();
        });

        this.payloadSocket.on('error', (error) => {
            this.logger.error('Error connecting to Payload API WebSocket server:');
            this.logger.error(error);
            this.payloadSocket.close();
            scheduleReconnect();
        });
    };

    const scheduleReconnect = () => {
        this.logger.log(`Attempting to reconnect in ${RECONNECT_DELAY / 1000} seconds...`);
        if (this.payloadSocket) {
          this.payloadSocket.removeAllListeners(); // Remove all listeners from the current socket
          this.payloadSocket = null; // Dereference the old socket
      }
      reconnectTimeout = setTimeout(connectToPayload, RECONNECT_DELAY);
    };
    let reconnectTimeout = setTimeout(connectToPayload, 0); // Start the first connection attempt immediately
  }
  
  private receivePayloadMessage(command: PayloadCommandResultDto){
    const commandId = command.id;
    const pendingCommand : PendingPayloadCommandDto = this.pendingCommands.get(commandId);
    if(pendingCommand){
      //this is a response from a command we sent
      this.logger.debug("Payload API response received, forwarding to client: " + JSON.stringify(command));
      const result = {
        ...pendingCommand, 
        resourceName: path.join(CLIENT_PAYLOAD_FOLDER, path.basename(pendingCommand.resourceName)), 
        message: command.message
      };
      pendingCommand.resolve(result);
      this.pendingCommands.delete(commandId);
    }
  }
  
  async handlePayloadCommand(clientId: string, command: PayloadCommandDto): Promise<any> {
    return new Promise((resolve, reject) => {
      try{
        command.id = generateId();
        const payloadFolder = getHostPayloadFolder(clientId);
        command.resourceName = path.join(payloadFolder, command.resourceName);
        const pendingCommand : PendingPayloadCommandDto = {
          ...command,
          resolve
        }
        this.pendingCommands.set(pendingCommand.id, pendingCommand)
        if(this.payloadSocket && this.payloadSocket.readyState == WebSocket.OPEN){
          this.logger.debug("SENDING command to Payload API");
          this.logger.debug(JSON.stringify(command));
          this.payloadSocket.send(JSON.stringify(command));
        }
        else{
          this.logger.error("Payload API Socket is not connected, cannot send message to Payload");
          resolve({...command, message: "Payload API Socket is not connected, cannot send message to Payload"});
        }
      }catch(e){
        this.logger.error("Error sending command to Payload API: " + e);
        resolve({...command, message: "Error sending command to Payload API: " + e});
      }
    });
  }
}
