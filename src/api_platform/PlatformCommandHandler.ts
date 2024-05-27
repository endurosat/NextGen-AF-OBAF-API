export interface PlatformCommandHandler{
    preparePlatformCommand(client: any, command: any) : any;
    sendPlatformMessage(command: any) : void;
    receivePlatformMessage(command: any) : void;
}