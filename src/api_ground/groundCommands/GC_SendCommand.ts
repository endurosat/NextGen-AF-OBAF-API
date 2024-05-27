import { Socket } from "socket.io-client";
import { GroundCommandHandler } from "./GroundCommandHandler";
import { Logger } from "@nestjs/common";
import { GroundCommandDto } from "../dtos/GroundCommandDto";
import { ClientService } from "src/clients/client.service";

export class SendCommand extends GroundCommandHandler {

  constructor(private readonly clientService : ClientService) {
    super();
  }

  async execute(client: Socket, command: GroundCommandDto): Promise<any> {
    
    if (command.hasOwnProperty("fpHeader")) {
      delete command.fpHeader;
    }
    Logger.debug("SENDING Ground command to client app - " + JSON.stringify(command));
    const status = await this.clientService.sendCommandToClientApp(client, command);
    return {status : status};
  }
}