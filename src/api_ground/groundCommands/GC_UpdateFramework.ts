import { Socket } from "socket.io-client";
import { Logger } from "@nestjs/common";
import { UpdateClient } from "./GC_UpdateClient";

export class UpdateFramework extends UpdateClient {

  constructor() {
    super();
    this.logger  = new Logger(UpdateFramework.name);
  } 

  async execute(client: Socket, command: any): Promise<any> {

    this.logger.debug(`Updating Framework!`);

    const imageName = process.env.FRAMEWORK_UPDATER_NAME || "gateway-updater";

    let image = this.docker.getImage(imageName);
    const imageExists = await this.imageExists(image);
    if(imageExists){
      const containers = await this.docker.listContainers({ all: true });
      const targetContainer = containers.find(container => container.Image.startsWith(imageName));
      if(targetContainer){
        //start it
        this.logger.debug(`Starting Framework updater...`);
        const container = this.docker.getContainer(targetContainer.Id);
        await container.start();
        return {status : `Framework update initialized`};
      }
    }
    else{
      this.logger.error(`Updater container does not exist! This should never happen`);
      return {status : `Updater container does not exist! This should never happen`};
    }
  }
}