import { Injectable, Logger, OnModuleInit } from "@nestjs/common";
import { GetContainerStatus } from "./GC_GetContainerStatus";
import { GroundCommandHandler } from "./GroundCommandHandler";
import { StartContainer } from "./GC_StartContainer";
import { StopContainer } from "./GC_StopContainer";
import { SendCommand } from "./GC_SendCommand";
import { ScheduleStartContainer } from "./GC_ScheduleStartContainer";
import { ScheduleStopContainer } from "./GC_ScheduleStopContainer";
import { ScheduledCommandsDB } from "./SheduledCommandsDB";
import { GroundCommandDto } from "../dtos/GroundCommandDto";
import { UpdateClient } from "./GC_UpdateClient";
import { UpdateFramework } from "./GC_UpdateFramework";
import { ClientService } from "src/clients/client.service";

@Injectable()
export class GroundCommandFactory implements OnModuleInit {
  
    private logger = new Logger(GroundCommandFactory.name);

    constructor(private readonly clientService: ClientService) {}

    private commandMap: Map<string, GroundCommandHandler> = new Map();

    onModuleInit() {
        this.commandMap.set('getContainerStatus', new GetContainerStatus());
        this.commandMap.set('startContainer', new StartContainer());
        this.commandMap.set('stopContainer', new StopContainer());
        this.commandMap.set('sendCommand', new SendCommand(this.clientService));
        this.commandMap.set('scheduleStartContainer', new ScheduleStartContainer());
        this.commandMap.set('scheduleStopContainer', new ScheduleStopContainer());
        this.commandMap.set('updateClient', new UpdateClient());
        this.commandMap.set('updateFramework', new UpdateFramework());

        //schedule all persisted scheduled commands
        const scheduledCommands = ScheduledCommandsDB.getAll();
        for (const commandId in scheduledCommands) {
            const command : GroundCommandDto = scheduledCommands[commandId];
            const commandHandler = this.commandMap.get(command.name);
            if (commandHandler) {
                const timestamp = command.timestamp*1000; //convert to milliseconds. We need Int64 in the fidl to support miliseconds as input
                if(timestamp < Date.now()){
                    this.logger.debug(`NextGen - SCHEDULED Ground command - ${command.name} - timestamp is in the past`);
                    ScheduledCommandsDB.delete(command.id);
                    continue;
                }
                this.logger.debug(`NextGen - SCHEDULED Ground command - ${command.name}`);
                commandHandler.execute(null, command);
            }
        }
    }


  create(command: string): GroundCommandHandler {
      const commandHandler = this.commandMap.get(command);
      return commandHandler;
  }

}