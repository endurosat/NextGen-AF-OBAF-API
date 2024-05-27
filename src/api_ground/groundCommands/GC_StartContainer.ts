import { Socket } from "socket.io-client";
import { GroundCommandHandler } from "./GroundCommandHandler";
import { Logger } from "@nestjs/common";
import * as Docker from 'dockerode';
import { GroundCommandDto } from "../dtos/GroundCommandDto";

export class StartContainer extends GroundCommandHandler {

  protected logger = new Logger(StartContainer.name);

  async execute(client: Socket, command: GroundCommandDto): Promise<any> {
    const imageName = command.clientId;
    const docker = new Docker();
    try {
      const containers = await docker.listContainers({ all: true });
      const runningContainer = containers.find(container => 
        container.Image.startsWith(imageName) && container.State === 'running');
  
      if (runningContainer) {
        this.logger.log(`A container for image ${imageName} is already running.`);
        return {status : `A container for image ${imageName} is already running.`};
      }
      
      const stoppedContainer = containers.find(container => 
        container.Image.startsWith(imageName));
  
      if (stoppedContainer) {
        const container = docker.getContainer(stoppedContainer.Id);
        await container.start();
        this.logger.log(`Container started with ID: ${stoppedContainer.Id}`);
        return {status : `Container started with ID: ${stoppedContainer.Id}`}
      }
  
      const images = await docker.listImages({ filters: { reference: [imageName] } });
      const imageExists = images.length > 0;
      if (imageExists) {
        this.logger.debug(`Image ${imageName} found. Creating and starting container...`);
        const container = await docker.createContainer({
          Image: imageName,
          AttachStdin: false,
          AttachStdout: true,
          AttachStderr: true,
          Tty: true
        });
  
        await container.start();
        this.logger.log(`Container started with ID: ${container.id}`);
        return {status : `Container started with ID: ${container.id}`}
      } else {
        this.logger.log(`Image ${imageName} not found locally.`);
        return {status : `Image ${imageName} not found locally.`}
      }
    } catch (error) {
      this.logger.error('Error:', error);
      return {status : error};
    }
  }
}