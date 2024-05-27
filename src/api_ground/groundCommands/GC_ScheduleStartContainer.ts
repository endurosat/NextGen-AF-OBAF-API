import { Socket } from "socket.io-client";
import { StartContainer } from "./GC_StartContainer";
import { ScheduledCommandsDB } from "./SheduledCommandsDB";
import { GroundCommandDto } from "../dtos/GroundCommandDto";

export class ScheduleStartContainer extends StartContainer {

  async execute(client: Socket, command: GroundCommandDto): Promise<any> {
    
    const timestamp = command.timestamp*1000;//convert to milliseconds. We need Int64 in the fidl to support miliseconds as input
    
    if (timestamp < Date.now()) {
      this.logger.error("timestamp " + timestamp + " is in the past, now is " + Date.now() + ", difference is " + (timestamp - Date.now()));
      return {status : "timestamp " + timestamp + " is in the past, now is " + Date.now() + ", difference is " + (timestamp - Date.now())};
    }
    
    ScheduledCommandsDB.save(command)

    setTimeout(() => {
      ScheduledCommandsDB.delete(command.id);
      super.execute(client, command);
    }, timestamp - Date.now());
    this.logger.debug(`Container start scheduled after ${(timestamp - Date.now())/1000} seconds`);
    return {status : `Container start scheduled after ${(timestamp - Date.now())/1000} seconds`};
  }
}