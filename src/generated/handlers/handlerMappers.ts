import Operation from "../artifacts/operation";

// tslint:disable:one-line

export interface IHandlerPath {
  handler: string;
  method: string;
  arguments: string[];
}

const operationHandlerMapping: {[key: number]: IHandlerPath} = {};

operationHandlerMapping[Operation.SetSecret] = {
  arguments: [
    "secretName",
    "value",
    "options"
  ],
  handler: "voltServerSecretsHandler",
  method: "setSecret"
};
operationHandlerMapping[Operation.DeleteSecret] = {
  arguments: [
    "secretName",
    "options"
  ],
  handler: "voltServerSecretsHandler",
  method: "deleteSecret"
};
operationHandlerMapping[Operation.UpdateSecret] = {
  arguments: [
    "secretName",
    "secretVersion",
    "options"
  ],
  handler: "voltServerSecretsHandler",
  method: "updateSecret"
};
operationHandlerMapping[Operation.GetSecret] = {
  arguments: [
    "secretName",
    "secretVersion",
    "options"
  ],
  handler: "voltServerSecretsHandler",
  method: "getSecret"
};
operationHandlerMapping[Operation.GetSecrets] = {
  arguments: [
    "options"
  ],
  handler: "voltServerSecretsHandler",
  method: "getSecrets"
};
operationHandlerMapping[Operation.GetSecretVersions] = {
  arguments: [
    "secretName",
    "options"
  ],
  handler: "voltServerSecretsHandler",
  method: "getSecretVersions"
};
operationHandlerMapping[Operation.GetDeletedSecrets] = {
  arguments: [
    "options"
  ],
  handler: "voltServerSecretsHandler",
  method: "getDeletedSecrets"
};
operationHandlerMapping[Operation.GetDeletedSecret] = {
  arguments: [
    "secretName",
    "options"
  ],
  handler: "voltServerSecretsHandler",
  method: "getDeletedSecret"
};
operationHandlerMapping[Operation.RecoverDeletedSecret] = {
  arguments: [
    "secretName",
    "options"
  ],
  handler: "voltServerSecretsHandler",
  method: "recoverDeletedSecret"
};
operationHandlerMapping[Operation.BackupSecret] = {
  arguments: [
    "secretName",
    "options"
  ],
  handler: "voltServerSecretsHandler",
  method: "backupSecret"
};
operationHandlerMapping[Operation.RestoreSecret] = {
  arguments: [
    "secretBundleBackup",
    "options"
  ],
  handler: "voltServerSecretsHandler",
  method: "restoreSecret"
};
function getHandlerByOperation(operation: Operation): IHandlerPath | undefined {
  return operationHandlerMapping[operation];
}
export default getHandlerByOperation;
