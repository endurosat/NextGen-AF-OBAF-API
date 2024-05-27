import * as crypto from 'crypto';

export const EVENT_EXECUTE : string = "execute";
export const EVENT_ERROR : string = "error";
export const GROUND_COMMANDS_JSON : string = "config/ground-commands.json";
export const SCHEDULED_COMMANDS_JSON : string = "config/scheduled-commands.json";

export const FPGA_RECONFIGURE_BITSTREAM : string = "FPGAReconfigure";

export function getTlsCert() : string {
  throw new Error("Method not implemented. add clientcert.pem");
}

export function getTlsKey() : string {
  throw new Error("Method not implemented. add clientkey.pem");
}

export function generateId() : number {
  const randomBytes = crypto.randomBytes(4);
  const unsignedNumber = randomBytes.readUInt32BE(0);
  
  // Ensure it's positive by masking with 0x7FFFFFFF (2147483647)
  const positiveNumber = unsignedNumber & 0x7FFFFFFF;

  return positiveNumber;
}

export function formatPublicKey(base64Key: string): string {
  const pemHeader = "-----BEGIN PUBLIC KEY-----\n";
  const pemFooter = "\n-----END PUBLIC KEY-----";

  // Split the base64 string into 64 character chunks
  const formattedKey = base64Key.match(/.{1,64}/g)?.join('\n') ?? "";
  
  return pemHeader + formattedKey + pemFooter;
}

export function getHostPayloadFolder(clientId : string) : string {
  clientId = clientId.toLowerCase();
  //we need to provide the host machine absolute path because PAYLOAD API is running on the host machine
  const pathPrefix = process.env.PAYLOAD_FOLDER || "/home/es/nextgen/diffs";
  return `${pathPrefix}/${clientId}-payload`;
}

export function getPayloadFolder(clientId : string) : string {
  clientId = clientId.toLowerCase();
  return `/host/${clientId}-payload`;
}

export const CLIENT_PAYLOAD_FOLDER = '/payload';