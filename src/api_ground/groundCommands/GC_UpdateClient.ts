import { Socket } from "socket.io-client";
import { GroundCommandHandler } from "./GroundCommandHandler";
import { Logger } from "@nestjs/common";
import * as Docker from 'dockerode';
import { promisify } from "util";
import { exec } from 'child_process';
import * as fs from 'fs';
import { CLIENT_PAYLOAD_FOLDER, getHostPayloadFolder, getPayloadFolder } from "src/util/utils";

export class UpdateClient extends GroundCommandHandler {

  protected logger = new Logger(UpdateClient.name);
  private execPromise = promisify(exec);
  protected docker = new Docker();

  async execute(client: Socket, command: any): Promise<any> {
    const imageName = command.clientId;
    this.logger.debug(`Updating client with image: ${imageName}`);

    const payloadFolder = getPayloadFolder(imageName);
    try {

      const tarPath = `/host/${imageName}.tar`;
      if(!fs.existsSync(tarPath)){
        //initial deploy, we make a diff patch from the base image
        const baseImagePath = '/host/nextgen-base-image-client.tar';
        if(!fs.existsSync(baseImagePath)){
          this.logger.error(`Initial deploy, but base image does not exist at ${baseImagePath}`);
          return {status : `Initial deploy, but base image does not exist at ${baseImagePath}`}
        }
        await this.executeCommandOnHost(`cp ${baseImagePath} ${tarPath}`);
        //a folder for all payload resources generated
        await this.executeCommandOnHost(`mkdir ${payloadFolder}`);
      }

      this.logger.debug(`Patching the Docker image ${imageName}...`);
      await this.executeCommandOnHost(`tar -xf /host/${imageName}-bundle.tar.xz -C /host`);
      await this.executeCommandOnHost(`rdiff patch ${tarPath} /host/${imageName}.diff /host/${imageName}-patched.tar`);

      await this.executeCommandOnHost(`mv ${tarPath} /host/${imageName}-old.tar`);
      await this.executeCommandOnHost(`mv /host/${imageName}-patched.tar ${tarPath}`);

      this.logger.debug(`Stopping and removing the container and image...`);
      const containers = await this.docker.listContainers({ all: true });
      const targetContainer = containers.find(container => container.Image.startsWith(imageName));
      if (targetContainer) {
        this.logger.debug(`Stopping container with ID ${targetContainer.Id} running image ${imageName}...`);
        const container = this.docker.getContainer(targetContainer.Id);
        try{
          await container.stop();
        }
        catch(error){
          this.logger.error(`Failed to stop container ${targetContainer.Id}: ${error.message}`);
        }
        await container.remove();
      }
      else{
        this.logger.debug(`No container running the image ${imageName}. Probably a first deploy!`);
      }
      await this.removeAllImagesWithName(imageName);
      
      await this.loadDockerImageFromTar(tarPath)
        .then(() => this.logger.log('Docker image loaded successfully.'))
        .catch(error => {
          this.logger.error('Failed to load Docker image:', error);
          return {status : `Failed to load Docker image: ${error.message}`}
        });
     
      this.logger.debug(`Starting the container with the patched image ${imageName}...`);
      const clientConfigContents = fs.readFileSync('/host/config.json', 'utf8');
      const clientConfig = JSON.parse(clientConfigContents);
      const jwtPayload = clientConfig.jwtPayload;
      const port = clientConfig.port.toString();
      const version = clientConfig.version;
      const privateNetwork = process.env.PRIVATE_NETWORK || 'app-network';

      await this.docker.createContainer(
        {
          Image: `${imageName}:${version}`,
          name: imageName,
          ExposedPorts: {
            [`${port}/tcp`]: {},
          },
          Env : [
            `JWT_PAYLOAD=${jwtPayload}`
          ],
          HostConfig: {
            PortBindings: {
              [`${port}/tcp`]: [{ HostPort: port }],
            },
            NetworkMode: privateNetwork,
            Binds: [
              `${getHostPayloadFolder(imageName)}:${CLIENT_PAYLOAD_FOLDER}`
            ]
          }
        }
      );
      
      this.logger.debug(`Client updated successfully`);

      this.logger.debug(`Removing unused files...`);
      await this.executeCommandOnHost(`rm /host/${imageName}-old.tar`);
      await this.executeCommandOnHost(`rm /host/${imageName}-bundle.tar.xz`);
      await this.executeCommandOnHost(`rm /host/${imageName}.diff`);
      await this.executeCommandOnHost(`rm /host/config.json`);

      return {status : `Application ${imageName} updated successfully`};
    } 
    catch (error) {
      return {status : error.message}
    }
  }

  private async removeAllImagesWithName(imageName: string): Promise<void> {
    try {
      // List all images with the specific name (regardless of their tag)
      const images = await this.docker.listImages({filters: {reference: [imageName]}});
      
      if (images.length === 0) {
          this.logger.debug(`Image ${imageName} does not exist. Definitely a first deploy!`);
          return;
      }
      for (const imageInfo of images) {
        const imageId = imageInfo.Id;
        const image = this.docker.getImage(imageId);
        try {
            this.logger.debug(`Removing image ${imageId}...`);
            await image.remove();
            this.logger.debug(`Successfully removed image ${imageId}.`);
        } catch (error) {
            this.logger.error(`Failed to remove image ${imageId}: ${error.message}`);
        }
      }
    } catch (error) {
        this.logger.error(`An error occurred while removing images: ${error.message}`);
    }

    this.logger.debug(`All versions of the image ${imageName} have been removed.`);
  }

  async imageExists(image: Docker.Image): Promise<boolean> {
    try {
      await image.inspect();
      return true;
    } catch (error) {
      return false;
    }
  }

  async loadDockerImageFromTar(tarPath: string): Promise<void> {
    const docker = new Docker();
  
    try {
      const tarStream = fs.createReadStream(tarPath);
      this.logger.debug("LOADING STARTED")
      await docker.loadImage(tarStream);
      this.logger.debug("LOADING ENDED")
  
      this.logger.log('Docker image loaded successfully.');
    } catch (error) {
      this.logger.error('Error loading Docker image:', error);
      throw error;
    }
  }

  async executeCommandOnHost(command: string): Promise<string> {
      
      try {
        const { stdout, stderr } = await this.execPromise(command);
          if (stderr) {
            this.logger.error(`Error executing command: ${stderr}`);
            return stderr;
          }
          this.logger.debug(`Command executed successfully: ${stdout}`);
          return stdout;
      } catch (error) {
          this.logger.error(`Failed to execute command on host: ${error.message}`);
          throw new Error(`Failed to execute command on host: ${error.message}`);
      }
  }
}