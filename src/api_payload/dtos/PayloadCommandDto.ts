export enum PayloadCommand {
  CAPTURE_IMAGE = "CAPTURE_IMAGE",
  //...
}

export enum PayloadCommandImageFormat {
  IMAGE_FORMAT_PNG = "IMAGE_FORMAT_PNG",
  IMAGE_FORMAT_TIFF = "IMAGE_FORMAT_TIFF",
  //...
}

export interface PayloadCommandDto {
  id : number;//the unique ID of the command
  name : PayloadCommand;//the command to be executed, name property is imperative for the JWTAuthInterceptor to pick it up
  payloadId: string;//the ID of the payload
  resourceFormat: PayloadCommandImageFormat;//the format of the image or other output file
  resourceName: string;//the name of the image or other output file
}