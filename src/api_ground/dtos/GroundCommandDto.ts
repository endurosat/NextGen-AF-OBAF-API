
export class GroundCommandDto {

  id: number;
  name: string;
  clientId: string;
  request: string;
  fpHeader: string;
  timestamp: number;

  constructor(id: number, name: string, clientId: string, request: string, fpHeader: string, timestamp: number) {
    this.id = id;
    this.name = name;
    this.clientId = clientId;
    this.request = request;
    this.fpHeader = fpHeader;
    this.timestamp = timestamp;
  }

}