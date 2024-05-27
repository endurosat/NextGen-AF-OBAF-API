import { PayloadCommandDto } from "./PayloadCommandDto";
import { PayloadCommandResultDto } from "./PayloadCommandResultDto";
  
export interface PendingPayloadCommandDto extends PayloadCommandDto{
  resolve: (value?: PayloadCommandResultDto) => void;//the resolve function to call when the command is complete
}