import { Socket } from "socket.io-client";
import { GroundCommandDto } from "src/api_ground/dtos/GroundCommandDto";

export interface PendingClientCommandDto extends GroundCommandDto  {
    client: Socket;
    resolve: (value?: unknown) => void;
}