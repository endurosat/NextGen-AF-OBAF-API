import { Injectable, Logger } from '@nestjs/common';
import { FPGA_RECONFIGURE_BITSTREAM } from 'src/util/utils';
import * as WebSocket from 'ws';
import { FPGACommandDto } from './dtos/FPGACommandDto';
import { PendingFPGACommandDto } from './dtos/PendingFPGACommandDto';
import { promises as fs } from 'fs';

const RECONNECT_DELAY = 5000;

@Injectable()
export class FPGAService {
  private logger = new Logger(FPGAService.name);
  private fpgaSocket : WebSocket;
  //command UUID -> command data
  private pendingCommands = new Map<string, PendingFPGACommandDto>();

  constructor() {
    this.connect();
  }

  listen(){
    this.fpgaSocket.onmessage = (e) => {
      let json = JSON.parse(e.data);
      this.receiveFPGAMessage(json)
      if (json.type == "Error") {
        this.logger.error("FPGA API Result Error: " + JSON.stringify(json));
      }
    };
  }

  connect(){
    const hostIp = process.env.FPGA_API_HOST || "localhost";
    const hostPort = process.env.FPGA_API_PORT || "8082";

    const connectToFPGA = () => {
        this.logger.log("Connecting to FPGA API at " + hostIp);

        this.fpgaSocket = new WebSocket('ws://' + hostIp + ':' + hostPort,{});

        this.fpgaSocket.on('open', () => {
            this.logger.log('Connected to FPGA API WebSocket server');
            clearTimeout(reconnectTimeout);
            this.listen();
        });

        this.fpgaSocket.on('close', () => {
            this.logger.log('Disconnected from FPGA API WebSocket server');
            scheduleReconnect();
        });

        this.fpgaSocket.on('error', (error) => {
            this.logger.error('Error connecting to FPGA API WebSocket server:');
            this.logger.error(error);
            this.fpgaSocket.close();
            scheduleReconnect();
        });
    };

    const scheduleReconnect = () => {
        this.logger.log(`Attempting to reconnect in ${RECONNECT_DELAY / 1000} seconds...`);
        if (this.fpgaSocket) {
          this.fpgaSocket.removeAllListeners(); // Remove all listeners from the current socket
          this.fpgaSocket = null; // Dereference the old socket
      }
      reconnectTimeout = setTimeout(connectToFPGA, RECONNECT_DELAY);
    };
    let reconnectTimeout = setTimeout(connectToFPGA, 0); // Start the first connection attempt immediately
  }
  
  private receiveFPGAMessage(command){
    const commandId = command.Id;
    const pendingCommand : PendingFPGACommandDto = this.pendingCommands.get(commandId);
    if(pendingCommand){
      //this is a response from a command we sent
      this.logger.debug("FPGA API response received, forwarding to client: " + JSON.stringify(command));
      pendingCommand.resolve(command);
    }
  }
  
  async handleFPGACommand(command: FPGACommandDto): Promise<any> {
    return new Promise((resolve, reject) => {
      try{
        if(command.name == FPGA_RECONFIGURE_BITSTREAM){
          resolve(this.changeFPGABitStream(command));
        }
        else{
          const pendingCommand : PendingFPGACommandDto = {
            ...command,
            Type : command.name,
            resolve
          }
          this.pendingCommands.set(pendingCommand.Id, pendingCommand)
          if(this.fpgaSocket && this.fpgaSocket.readyState == WebSocket.OPEN){
            this.logger.debug("SENDING command to FPGA API");
            command.Type = command.name;
            this.logger.debug(JSON.stringify(command));
            this.fpgaSocket.send(JSON.stringify(command));
          }
          else{
            this.logger.error("FPGA API Socket is not connected, cannot send message to FPGA");
            resolve({...command, message: "FPGA API Socket is not connected, cannot send message to FPGA"});
          }
        }
      }catch(e){
        this.logger.error("Error sending command to FPGA API: " + e);
        resolve({...command, message: "Error sending command to FPGA API: " + e});
      }
    });
  }

  private async changeFPGABitStream(command: FPGACommandDto): Promise<any> {
    try{
      this.logger.debug("Changing FPGA bitstream to: " + command.bitstream);
      const path = "/sys/class/fpga_manager/fpga0/firmware"
      const fileExists = await this.checkFileExists(path);
      if(fileExists){
        await fs.writeFile(path, command.bitstream);
        this.logger.debug('FPGA Reconfigured successfully with bitstream ' + command.bitstream);
        return ({...command, message : "FPGA Reconfigured successfully with bitstream " + command. bitstream});
      }
      else{
        this.logger.error("FPGA Manager not found at path: " + path);
        return ({...command, message: "FPGA Manager not found at path: " + path});
      }
    }catch(e){
      this.logger.error("Error changing FPGA bitstream: " + e);
      return ({...command, message: "Error changing FPGA bitstream: " + e});
    }
  }

  private async checkFileExists(path: string): Promise<boolean> {
    try {
      await fs.access(path);
      return true;  // The file exists
    } catch {
      return false; // The error indicates the file does not exist
    }
  }
}
