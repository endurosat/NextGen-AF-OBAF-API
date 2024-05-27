import { FPGACommandDto } from "./FPGACommandDto";
  
export interface PendingFPGACommandDto extends FPGACommandDto{
  resolve: (value) => void;//the resolve function to call when the command is complete
}