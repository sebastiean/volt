import { RequestOptionsBase, RestResponse } from "@azure/core-http";

import * as Models from "../generated/artifacts/models";
import Context from "../generated/Context";
import IVoltServerSecretsHandler from "../generated/handlers/IVoltServerSecretsHandler";
import ILogger from "../ILogger";
import NotImplementedError from "../errors/NotImplementedError";
import KeyVaultErrorFactory from "../errors/KeyVaultErrorFactory";
import ISecretsMetadataStore from "../persistence/ISecretsMetadataStore";
import BaseHandler from "./BaseHandler";

/**
 * SecretsHandler handles Azure Storage Blob related requests.
 *
 * @export
 * @class SecretsHandler
 * @extends {BaseHandler}
 * @implements {IVoltServerSecretsHandler}
 */
export default class SecretsHandler extends BaseHandler implements IVoltServerSecretsHandler {
  constructor(
    metadataStore: ISecretsMetadataStore,
    logger: ILogger
  ) {
    super(metadataStore, logger);
  }
  setSecret(secretName: string, value: string, options: Models.VoltServerSecretsSetSecretOptionalParams, context: Context): Promise<Models.SetSecretResponse> {
    throw new NotImplementedError();
  }
  deleteSecret(secretName: string, options: RequestOptionsBase, context: Context): Promise<Models.DeleteSecretResponse> {
    throw new NotImplementedError();
  }
  updateSecret(secretName: string, secretVersion: string, options: Models.VoltServerSecretsUpdateSecretOptionalParams, context: Context): Promise<Models.UpdateSecretResponse> {
    throw new NotImplementedError();
  }
  getSecret(secretName: string, secretVersion: string, options: RequestOptionsBase, context: Context): Promise<Models.GetSecretResponse> {
    throw new NotImplementedError();
  }
  getSecrets(options: Models.VoltServerSecretsGetSecretsOptionalParams, context: Context): Promise<Models.GetSecretsResponse> {
    throw new NotImplementedError();
  }
  getSecretVersions(secretName: string, options: Models.VoltServerSecretsGetSecretVersionsOptionalParams, context: Context): Promise<Models.GetSecretVersionsResponse> {
    throw new NotImplementedError();
  }
  getDeletedSecrets(options: Models.VoltServerSecretsGetDeletedSecretsOptionalParams, context: Context): Promise<Models.GetDeletedSecretsResponse> {
    throw new NotImplementedError();
  }
  getDeletedSecret(secretName: string, options: RequestOptionsBase, context: Context): Promise<Models.GetDeletedSecretResponse> {
    throw new NotImplementedError();
  }
  purgeDeletedSecret(secretName: string, options: RequestOptionsBase, context: Context): Promise<RestResponse> {
    throw new NotImplementedError();
  }
  recoverDeletedSecret(secretName: string, options: RequestOptionsBase, context: Context): Promise<Models.RecoverDeletedSecretResponse> {
    throw new NotImplementedError();
  }
  backupSecret(secretName: string, options: RequestOptionsBase, context: Context): Promise<Models.BackupSecretResponse> {
    throw new NotImplementedError();
  }
  restoreSecret(secretBundleBackup: Uint8Array, options: RequestOptionsBase, context: Context): Promise<Models.RestoreSecretResponse> {
    throw new NotImplementedError();
  }
}