import {
    Injectable,
    NestInterceptor,
    ExecutionContext,
    CallHandler,
    Logger,
  } from '@nestjs/common';
import * as jwt from 'jsonwebtoken';
import { EMPTY, Observable } from 'rxjs';
import { JWTPayloadValidator } from './AuthValidator';
import { EVENT_ERROR, formatPublicKey } from 'src/util/utils';
  
@Injectable()
export class JwtInterceptor implements NestInterceptor {
  
  private logger = new Logger(JwtInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    
    const wsContext = context.switchToWs();
    const client = wsContext.getClient();
    let body = wsContext.getData();
    const authorizationHeader = wsContext.getClient().handshake.headers.authorization;
    
    let jwtToken = authorizationHeader?.split(' ')[1];//remove "Bearer"

    /*
      to build a JWT for testing purposes:
       - go to https://token.dev/
       - choose algorithm RS256
       - for payload add the contents of src/auth/example_jwt_payload
       - for public key add the contents of ./src/auth/signature_public_key.txt
       - for private key add the contents of ./src/auth/signature_private_key.txt
       copy the JWT String (it should say "verified" besides) and use it to connect to the Socket server
    */

    if (!jwtToken) {
      return this.handleError(client, "JWT token is missing");
    }

    let decodedToken;
    try {
      const publicKey = formatPublicKey(process.env.JWT_PUBLIC_KEY);
      decodedToken = jwt.verify(jwtToken, publicKey, { algorithm: 'RS256' });
    } catch (error) {
      return this.handleError(client, "Invalid JWT token - " + error.message);
    }
    //if body is string, parse it to json
    if(typeof body === 'string'){
      body = JSON.parse(body);
    }
    if (!JWTPayloadValidator.isValidPoliciesObject(decodedToken)) {
      return this.handleError(client, "Invalid JWT token payload");
    }
    
    if(!JWTPayloadValidator.isRequestPermitted(decodedToken, body.name, body)){
      return this.handleError(client, "Command not permitted!");
    }
    return next.handle().pipe()
  }

  private handleError(client: any, err : string) : Observable<any> {
    this.logger.error(err)
    client.emit(EVENT_ERROR, { error: err });
    return EMPTY
  }
}
  