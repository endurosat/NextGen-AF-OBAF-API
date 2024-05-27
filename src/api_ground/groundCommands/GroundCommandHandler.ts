import { Socket } from "socket.io-client";
import { GroundCommandDto } from "../dtos/GroundCommandDto";

export abstract class GroundCommandHandler{

    abstract execute(client: Socket, command: GroundCommandDto ): Promise<any>;

}