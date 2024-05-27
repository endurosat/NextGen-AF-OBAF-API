export class ClientContainerDto {
  imageName: string;
  containerName: string;
  port: number;

  constructor(imageName: string, containerName: string, port: number) {
    this.imageName = imageName;
    this.containerName = containerName;
    this.port = port;
  }
}