import { Injectable, Logger } from "@nestjs/common";
import { readFileSync, writeFileSync } from "fs";
import { SCHEDULED_COMMANDS_JSON } from "src/util/utils";
import { GroundCommandDto } from "../dtos/GroundCommandDto";

interface ScheduledCommands {
  [commandId: string]: GroundCommandDto;
}

@Injectable()
export class ScheduledCommandsDB{

  private static logger = new Logger(ScheduledCommandsDB.name);

  public static save(command : GroundCommandDto){
    let fileContent = readFileSync(SCHEDULED_COMMANDS_JSON, "utf-8");
    let scheduledCommandsMap : ScheduledCommands = JSON.parse(fileContent);
    if(scheduledCommandsMap[command.id]){
      this.logger.debug(`Command with id ${command.id} already scheduled`);
      return `Command with id ${command.id} already scheduled`;
    }
    scheduledCommandsMap[command.id] = command;

    fileContent = JSON.stringify(scheduledCommandsMap, null, 2);
    writeFileSync(SCHEDULED_COMMANDS_JSON, fileContent, "utf-8");
  }

  public static delete(id : number){
    let fileContent = readFileSync(SCHEDULED_COMMANDS_JSON, "utf-8");
    let scheduledCommandsMap : ScheduledCommands = JSON.parse(fileContent);
    if(!scheduledCommandsMap[id]){
      this.logger.debug(`Command with id ${id} not found`);
      return `Command with id ${id} not found`;
    }
    delete scheduledCommandsMap[id];
    fileContent = JSON.stringify(scheduledCommandsMap, null, 2);
    writeFileSync(SCHEDULED_COMMANDS_JSON, fileContent, "utf-8");
  }

  public static getAll(){
    let fileContent = readFileSync(SCHEDULED_COMMANDS_JSON, "utf-8");
    let scheduledCommandsMap : ScheduledCommands = JSON.parse(fileContent);
    return scheduledCommandsMap;
  }
}