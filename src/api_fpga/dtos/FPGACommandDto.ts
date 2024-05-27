export interface FPGACommandDto {
  Id: string;//the unique UUID of the command
  name: string;//the command to be executed, name property is imperative for the JWTAuthInterceptor to pick it up
  Type: string//the command to be executed, same as name, but the API expects Type ...
  MemoryMappedRegisterLocation : string;
  PrivateMemoryRegisterLocation : string;
  DDRSize : number;
  Values : any;
  Timeout : number;
  Address : number;
  Value : number;
  StartAddress : number;
  EndAddress : number;
  bitstream : string; // the name of the bitstream file
}