import { RequestOptionsBase, RestResponse } from "@azure/core-http";
import md5 from "md5";

import * as Models from "../generated/artifacts/models";
import Context from "../generated/Context";
import IVoltServerSecretsHandler from "../generated/handlers/IVoltServerSecretsHandler";
import ILogger from "../ILogger";
import NotImplementedError from "../errors/NotImplementedError";
import KeyVaultErrorFactory from "../errors/KeyVaultErrorFactory";
import ISecretsMetadataStore from "../persistence/ISecretsMetadataStore";
import BaseHandler from "./BaseHandler";
import SecretsContext from '../context/SecretsContext';
import { SecretModel } from "../persistence/ISecretsMetadataStore";
import { buildKeyvaultIdentifier, parseNextMarker, buildNextMarker, buildSkipToken } from "../utils/utils";
import {
  DEFAULT_GET_SECRETS_MAX_RESULTS,
  DEFAULT_GET_SECRET_VERSIONS_MAX_RESULTS
} from "../utils/constants";

/**
 * SecretsHandler handles Azure Storage Blob related requests.
 *
 * @export
 * @class SecretsHandler
 * @extends {BaseHandler}
 * @implements {IVoltServerSecretsHandler}
 */
export default class SecretsHandler extends BaseHandler implements IVoltServerSecretsHandler {
  private httpServerAddress: string;
  private recoveryLevel: Models.DeletionRecoveryLevel;
  private recoverableDays: number;

  constructor(
    metadataStore: ISecretsMetadataStore,
    logger: ILogger,
    httpServerAddress?: string,
    recoveryLevel?: Models.DeletionRecoveryLevel,
    recoverableDays?: number
  ) {
    super(metadataStore, logger);
    this.httpServerAddress = httpServerAddress!;
    this.recoveryLevel = recoveryLevel!;
    this.recoverableDays = recoverableDays!;
  }

  public async setSecret(secretName: string, value: string, options: Models.VoltServerSecretsSetSecretOptionalParams, context: Context): Promise<Models.SetSecretResponse> {
    const secretsCtx = new SecretsContext(context);
    const date = context.startTime!;

    const secretVersion = md5(`${secretName}-${date.valueOf()}-${context.contextId}`);

    const secret: SecretModel = {
      secretName,
      secretVersion,
      value,
      id: buildKeyvaultIdentifier(this.httpServerAddress, secretName, secretVersion),
      contentType: options.contentType,
      attributes: {
        enabled: true,
        created: date,
        updated: date,
      },
      tags: options.tags,
      kid: undefined,
      managed: undefined
    };

    await this.metadataStore.setSecret(
      context,
      secret
    );

    const response: Models.SetSecretResponse = {
      statusCode: 200,
      value: secret.value,
      id: secret.id,
      contentType: secret.contentType,
      attributes: {
        enabled: secret.attributes!.enabled,
        created: secret.attributes!.created,
        updated: secret.attributes!.updated,
        recoveryLevel: this.recoveryLevel,
        recoverableDays: this.recoverableDays,
      }
    };

    return response;
  }

  deleteSecret(secretName: string, options: RequestOptionsBase, context: Context): Promise<Models.DeleteSecretResponse> {
    throw new NotImplementedError();
  }

  public async updateSecret(secretName: string, secretVersion: string, options: Models.VoltServerSecretsUpdateSecretOptionalParams, context: Context): Promise<Models.UpdateSecretResponse> {
    const date = context.startTime!;

    let attributes = options.secretAttributes;

    if (attributes?.created) {
      delete attributes.created;
    } else if (attributes?.expires) {
      delete attributes.expires;
    } else if (attributes?.notBefore) {
      delete attributes.notBefore;
    }

    const secret: SecretModel = {
      secretName,
      secretVersion,
      contentType: options.contentType,
      attributes: {
        ...attributes,
        updated: date
      },
      tags: options.tags,
      kid: undefined,
      managed: undefined
    };

    const result = await this.metadataStore.updateSecret(
      context,
      secret
    );

    const response: Models.SetSecretResponse = {
      statusCode: 200,
      value: result.value,
      id: result.id,
      contentType: result.contentType,
      attributes: {
        enabled: result.attributes!.enabled,
        created: result.attributes!.created,
        updated: result.attributes!.updated,
        recoveryLevel: this.recoveryLevel,
        recoverableDays: this.recoverableDays,
      }
    };

    return response;
  }
  public async getSecret(secretName: string, secretVersion: string, options: RequestOptionsBase, context: Context): Promise<Models.GetSecretResponse> {
    const secret = await this.metadataStore.getSecret(
      context,
      secretName,
      secretVersion
    );

    const response: Models.GetSecretResponse = {
      statusCode: 200,
      id: secret.id,
      value: secret.value,
      contentType: secret.contentType,
      attributes: {
        enabled: secret.attributes!.enabled,
        created: secret.attributes!.created,
        updated: secret.attributes!.updated,
        recoveryLevel: this.recoveryLevel,
        recoverableDays: this.recoverableDays,
      }
    };

    return response;
  }

  public async getSecretLatestVersion(secretName: string, options: RequestOptionsBase, context: Context): Promise<Models.GetSecretLatestVersionResponse> {
    const secret = await this.metadataStore.getSecret(
      context,
      secretName,
    );

    const response: Models.GetSecretLatestVersionResponse = {
      statusCode: 200,
      id: secret.id,
      value: secret.value,
      contentType: secret.contentType,
      attributes: {
        enabled: secret.attributes!.enabled,
        created: secret.attributes!.created,
        updated: secret.attributes!.updated,
        recoveryLevel: this.recoveryLevel,
        recoverableDays: this.recoverableDays,
      }
    };

    return response;
  }

  public async getSecrets(options: Models.VoltServerSecretsGetSecretsOptionalParams, context: Context): Promise<Models.GetSecretsResponse> {

    const secretsContext = new SecretsContext(context);

    let marker = "";
    if (secretsContext.nextMarker) {
      marker = parseNextMarker(secretsContext.nextMarker);
    }

    if (options.maxresults === undefined) {
      options.maxresults = DEFAULT_GET_SECRETS_MAX_RESULTS;
    } else if (options.maxresults > DEFAULT_GET_SECRETS_MAX_RESULTS) {
      throw KeyVaultErrorFactory.getBadParameter(context.contextId, "invalid maxresults");
    }

    const [secrets, nextMarker] = await this.metadataStore.getSecrets(
      context,
      options.maxresults,
      marker
    );

    let nextLink = null;
    if (nextMarker !== undefined) {
      const $skiptoken = buildSkipToken(buildNextMarker(nextMarker));
      nextLink = `${this.httpServerAddress}/secrets?api-version=${context.context.apiVersion}&$skiptoken=${$skiptoken}`

      if (options.maxresults < DEFAULT_GET_SECRETS_MAX_RESULTS) {
        nextLink += `&maxresults=${options.maxresults}`;
      }
    }

    const response: Models.GetSecretsResponse = {
      statusCode: 200,
      value: secrets.map(secret => {
        return {
          id: secret.id,
          contentType: secret.contentType,
          attributes: {
            enabled: secret.attributes!.enabled,
            created: secret.attributes!.created,
            updated: secret.attributes!.updated,
            recoveryLevel: this.recoveryLevel,
            recoverableDays: this.recoverableDays,
          }
        };
      }),
      nextLink
    };

    return response;
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