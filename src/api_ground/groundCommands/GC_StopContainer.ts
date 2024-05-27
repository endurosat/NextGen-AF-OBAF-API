import { Socket } from "socket.io-client";
import { GroundCommandHandler } from "./GroundCommandHandler";
import { Logger } from "@nestjs/common";
import * as Docker from 'dockerode';
import { GroundCommandDto } from "../dtos/GroundCommandDto";

export class StopContainer extends GroundCommandHandler {

  protected logger = new Logger(StopContainer.name);

  async execute(client: Socket, command: GroundCommandDto): Promise<any> {
    const imageName = command.clientId;
    const docker = new Docker();
  
    try {
      const containers = await docker.listContainers({ all: true });
      const targetContainer = containers.find(container => 
        container.Image.startsWith(imageName) && container.State === 'running');
      if (targetContainer) {
        this.logger.debug(`Stopping container with ID ${targetContainer.Id} running image ${imageName}...`);
        const container = docker.getContainer(targetContainer.Id);
        await container.stop();
        this.logger.debug(`Container with ID ${targetContainer.Id} has been stopped.`);
        return {status : `Container with ID ${targetContainer.Id} has been stopped.`};
      } else {
        this.logger.debug(`No running container found for image ${imageName}.`);
        return {status : `No running container found for image ${imageName}.`};
      }
    } catch (error) {
      this.logger.error('Error:', error);
      return {status : error};
    }
  }
}