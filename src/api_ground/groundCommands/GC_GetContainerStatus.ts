import { Socket } from "socket.io-client";
import { GroundCommandHandler } from "./GroundCommandHandler";
import { Logger } from "@nestjs/common";
import * as Docker from 'dockerode';
import { GroundCommandDto } from "../dtos/GroundCommandDto";

export class GetContainerStatus extends GroundCommandHandler {

  private logger = new Logger(GetContainerStatus.name);

  async execute(client: Socket, command: GroundCommandDto): Promise<any> {
    const imageName = command.clientId;
    const docker = new Docker();
    try {
      const containers = await docker.listContainers({ all: true });
      this.logger.debug('Containers found:');
      containers.forEach(container => this.logger.debug(`Container: ${container.Image} - ${container.State}`));
      const targetContainer = containers.find(container => container.Image.startsWith(imageName));
      if (targetContainer) {
        return {clientId : imageName, status : targetContainer.State};
      } else {
        return {clientId : imageName, status : `No container found for image ${imageName}.`};
      }
    } catch (error) {
      this.logger.error('Error:', error);
      return {clientId : imageName, status : error};;
    }
  }
}