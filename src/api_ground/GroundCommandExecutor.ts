export interface GroundCommandExecutor {
  executePlatformCommand(client: any, command: any): Promise<any>;
}