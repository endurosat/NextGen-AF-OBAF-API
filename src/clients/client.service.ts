import { Injectable, Logger, OnModuleInit } from "@nestjs/common";
import { Socket, io } from "socket.io-client";
import { EVENT_EXECUTE } from "src/util/utils";
import * as Docker from 'dockerode';
import { ClientContainerDto } from "./dtos/ClientContainerDto";
import { PendingClientCommandDto } from "./dtos/PendingClientCommandDto";
import { GroundCommandDto } from "src/api_ground/dtos/GroundCommandDto";

@Injectable()
export class ClientService implements OnModuleInit{
  private docker: Docker;
  private logger = new Logger(ClientService.name);
  //command id -> command data
  private pendingClientCommands = new Map<number, any>();
  private clientConnections = new Map<ClientContainerDto, Socket>();

  async onModuleInit() {
    setInterval(() => this.attemptConnection(), 2000);
  }

  private attemptConnection() {
    this.connectToClientApps().catch((error) => {
      this.logger.error('Error connecting to client apps:', error);
    });
  }  

  private async connectToClientApps() {
    const clientContainers = await this.getClientNamesAndPorts();
    clientContainers.forEach((container: ClientContainerDto) => {
      if(container.containerName.includes("gateway")) return;//skip playground container and OBAF container
      if(container.containerName.includes("esps-api")) return;//skip playground container
      
      const alreadyConnected = Array.from(this.clientConnections.keys())
        .some(existingContainer => existingContainer.imageName === container.imageName);

      if (!alreadyConnected) {
        this.connectToClientApp(container);
      }
    });
  }

  private connectToClientApp(container: ClientContainerDto) {
    const clientSocket = io(`ws://${container.containerName}:${container.port}/client`);
    clientSocket.on('connect', () => {
      this.logger.debug(`Connected to ${container.containerName} websocket server`);
      this.clientConnections.set(container, clientSocket);
    });
    clientSocket.on('executeResult', (data) => this.handleClientAppResponse(data));
    //wait 2 secconds and if connection is not OPEN, dispose of the socket
    setTimeout(() => {
      if(!clientSocket.connected){
        clientSocket.disconnect();
      }
    }, 2000);

  }

  async sendCommandToClientApp(client: Socket, command: GroundCommandDto) : Promise<string> {
    return new Promise((resolve, reject) => {
      const pendingCommand : PendingClientCommandDto = {
        ...command,
        client,
        resolve
      }
      this.pendingClientCommands.set(command.id, pendingCommand);
      this.logger.debug("SENDING Ground command to client app");
      for (const [container, socket] of this.clientConnections.entries()) {
        if(container.imageName == command.clientId){
          socket.emit(EVENT_EXECUTE, command);
          return;
        }
      }
      this.logger.error("Client app not found");
      resolve("Client app not found");
    });
  }

  private handleClientAppResponse(data: any) {
    this.logger.debug("RECEIVING response of ground command from client app - " + data.message);
    const commandId = data.id;
    const commandData : PendingClientCommandDto = this.pendingClientCommands.get(commandId);
    if(commandData){
      commandData.resolve(data.message);
      this.pendingClientCommands.delete(commandId);
    }
  }

  
  private async getClientNamesAndPorts(): Promise<Set<ClientContainerDto>> {
    this.docker = new Docker();
    try {
      const containers = await this.docker.listContainers();
      const containersInfo = new Set<ClientContainerDto>();
      containers.forEach(container => {
        const containerName = container.Names[0].replace(/^\//, '');
        const networks = container.NetworkSettings.Networks;
        if (networks?.[process.env.PRIVATE_NETWORK || 'app-network']) {
          const port = container.Ports[0].PublicPort;
          containersInfo.add(new ClientContainerDto(container.Image.split(':')[0], containerName, port));
        }
      });
      return containersInfo;
    } catch (error) {
      this.logger.error('Error fetching Docker services:', error);
      throw error;
    }
  }
}