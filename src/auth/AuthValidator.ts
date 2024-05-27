interface Policy {
  actions: string[];
  resources: object[];
}

interface PolicyObject {
  policies: Policy[];
}

export class JWTPayloadValidator {

  static isValidPoliciesObject(payload: any): boolean {
    if (!payload?.policies || !Array.isArray(payload?.policies)) {
      return false;
    }

    for (const policy of payload.policies) {
      if (!Array.isArray(policy.actions) || !policy.actions.every(a => typeof a === 'string')) {
        return false;
      }

      if (!Array.isArray(policy.resources) || !policy.resources.every(a => typeof a === 'object')) {
        return false;
      }
    }
    return true;
  }
  
  static isRequestPermitted(payload: PolicyObject, action: string, resource: any): boolean {
    let commandPermitted = false;
    for(const policy of payload.policies){
      if(policy.actions.includes(action)){
        for(const res of policy.resources){
          if(this.isSubset(res, resource)){
            commandPermitted = true;
            break;
          }
        }
      }
      if(commandPermitted){
        break;
      }
    }
    return commandPermitted;
  }

  private static isSubset(sourceObj: Record<string, any>, targetObj: Record<string, any>): boolean {
    for (let key in sourceObj) {
      if (sourceObj.hasOwnProperty(key)) {
        if (!targetObj.hasOwnProperty(key)) {
          return false;
        }

        if (this.isObject(sourceObj[key]) && this.isObject(targetObj[key])) {
          if (!this.isSubset(sourceObj[key], targetObj[key])) {
            return false;
          }
        } else if (sourceObj[key] !== targetObj[key]) {
          return false;
        }
      }
    }
    return true;
  }
  
  private static isObject(obj: any): obj is Record<string, any> {
    return obj !== null && typeof obj === 'object';
  }  
}