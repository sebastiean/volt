import { RequestOptionsBase, RestResponse } from "@azure/core-http";
import md5 from "md5";

import * as Models from "../generated/artifacts/models";
import Context from "../generated/Context";
import IVoltServerSecretsHandler from "../generated/handlers/IVoltServerSecretsHandler";
import ILogger from "../ILogger";
import NotImplementedError from "../errors/NotImplementedError";
import KeyVaultErrorFactory from "../errors/KeyVaultErrorFactory";
import ISecretsMetadataStore, { DeleteSecretProperties } from "../persistence/ISecretsMetadataStore";
import BaseHandler from "./BaseHandler";
import SecretsContext from "../context/SecretsContext";
import { SecretModel, DeletedSecretModel } from "../persistence/ISecretsMetadataStore";
import { buildKeyvaultIdentifier, buildRecoveryIdentifier, getScheduledPurgeDate } from "../utils/utils";
import { parseNextMarker, buildNextMarker, buildSkipToken, PaginationMarker } from "../utils/pagination";
import { DEFAULT_GET_SECRETS_MAX_RESULTS, DEFAULT_GET_SECRET_VERSIONS_MAX_RESULTS } from "../utils/constants";

/**
 * SecretsHandler handles Azure Storage Blob related requests.
 *
 * @export
 * @class SecretsHandler
 * @extends {BaseHandler}
 * @implements {IVoltServerSecretsHandler}
 */
export default class SecretsHandler extends BaseHandler implements IVoltServerSecretsHandler {
  private recoveryLevel: Models.DeletionRecoveryLevel;
  private recoverableDays: number;
  private disableSoftDelete: boolean;

  constructor(
    metadataStore: ISecretsMetadataStore,
    logger: ILogger,
    recoveryLevel?: Models.DeletionRecoveryLevel,
    recoverableDays?: number,
    disableSoftDelete?: boolean,
  ) {
    super(metadataStore, logger);
    this.recoveryLevel = recoveryLevel!;
    this.recoverableDays = recoverableDays!;
    this.disableSoftDelete = disableSoftDelete!;
  }

  public async setSecret(
    secretName: string,
    value: string,
    options: Models.VoltServerSecretsSetSecretOptionalParams,
    context: Context,
  ): Promise<Models.SetSecretResponse> {
    const secretsCtx = new SecretsContext(context);
    const request = secretsCtx.request!;
    const date = context.startTime!;

    await this.checkSecretIsDeleted(secretName, context);

    const secretVersion = md5(`${secretName}-${date.valueOf()}-${context.contextId}`);

    const secret: SecretModel = {
      name: secretName,
      version: secretVersion,
      value,
      id: buildKeyvaultIdentifier(request.getEndpoint(), secretName, secretVersion),
      contentType: options.contentType,
      attributes: {
        enabled: true,
        created: date,
        updated: date,
      },
      tags: options.tags,
      kid: undefined,
      managed: undefined,
    };

    const result = await this.metadataStore.setSecret(context, secret);

    const response: Models.SetSecretResponse = {
      statusCode: 200,
      value: result.value,
      id: buildKeyvaultIdentifier(request.getEndpoint(), result.name, result.version),
      contentType: result.contentType,
      attributes: {
        enabled: result.attributes!.enabled,
        created: result.attributes!.created,
        updated: result.attributes!.updated,
        recoveryLevel: this.recoveryLevel,
        recoverableDays: this.recoverableDays,
        expires: result.attributes?.expires,
        notBefore: result.attributes?.notBefore,
      },
      tags: result.tags,
      managed: result.managed,
      kid: result.kid,
    };

    return response;
  }

  public async deleteSecret(
    secretName: string,
    options: RequestOptionsBase,
    context: Context,
  ): Promise<Models.DeleteSecretResponse> {
    const secretsCtx = new SecretsContext(context);
    const request = secretsCtx.request!;
    const deletedDate = secretsCtx.startTime!;

    const scheduledPurgeDate = getScheduledPurgeDate(deletedDate, this.recoverableDays);
    const recoveryId = buildRecoveryIdentifier(request.getEndpoint(), secretName);

    const properties: DeleteSecretProperties = { scheduledPurgeDate, deletedDate, recoveryId };

    const deletedSecret: DeletedSecretModel = await this.metadataStore.deleteSecret(
      context,
      secretName,
      properties,
      this.disableSoftDelete,
    );

    const response: Models.DeleteSecretResponse = {
      statusCode: 200,
      id: buildKeyvaultIdentifier(request.getEndpoint(), deletedSecret.name, deletedSecret.version),
      contentType: deletedSecret.contentType,
      recoveryId: deletedSecret.recoveryId,
      deletedDate: deletedSecret.deletedDate,
      scheduledPurgeDate: deletedSecret.scheduledPurgeDate,
      attributes: {
        enabled: deletedSecret.attributes!.enabled,
        created: deletedSecret.attributes!.created,
        updated: deletedSecret.attributes!.updated,
        recoveryLevel: this.recoveryLevel,
        recoverableDays: this.recoverableDays,
        expires: deletedSecret.attributes?.expires,
        notBefore: deletedSecret.attributes?.notBefore,
      },
      tags: deletedSecret.tags,
      managed: deletedSecret.managed,
      kid: deletedSecret.kid,
    };

    return response;
  }

  public async updateSecretLatestVersion(
    secretName: string,
    options: Models.VoltServerSecretsUpdateSecretLatestVersionOptionalParams,
    context: Context,
  ): Promise<Models.UpdateSecretLatestVersionResponse> {
    return await this.updateSecret(secretName, "", options, context);
  }

  public async updateSecret(
    secretName: string,
    secretVersion: string,
    options: Models.VoltServerSecretsUpdateSecretOptionalParams,
    context: Context,
  ): Promise<Models.UpdateSecretResponse> {
    const secretsContext = new SecretsContext(context);
    const date = secretsContext.startTime!;
    const request = secretsContext.request!;

    await this.checkSecretIsDeleted(secretName, context);

    const attributes = options.secretAttributes;

    if (attributes?.created) {
      delete attributes.created;
    }

    const secret: SecretModel = {
      name: secretName,
      version: secretVersion,
      contentType: options.contentType,
      attributes: {
        ...attributes,
        updated: date,
      },
      tags: options.tags,
      kid: undefined,
      managed: undefined,
    };

    const result = await this.metadataStore.updateSecret(context, secret);

    const response: Models.UpdateSecretResponse = {
      statusCode: 200,
      id: buildKeyvaultIdentifier(request.getEndpoint(), result.name, result.version),
      contentType: result.contentType,
      attributes: {
        enabled: result.attributes!.enabled,
        created: result.attributes!.created,
        updated: result.attributes!.updated,
        recoveryLevel: this.recoveryLevel,
        recoverableDays: this.recoverableDays,
        expires: result.attributes?.expires,
        notBefore: result.attributes?.notBefore,
      },
      tags: result.tags,
      managed: result.managed,
      kid: result.kid,
    };

    return response;
  }

  public async getSecret(
    secretName: string,
    secretVersion: string,
    options: RequestOptionsBase,
    context: Context,
  ): Promise<Models.GetSecretResponse> {
    const secretsContext = new SecretsContext(context);
    const request = secretsContext.request!;

    const secret = await this.metadataStore.getSecret(context, secretName, secretVersion);

    const response: Models.GetSecretResponse = {
      statusCode: 200,
      id: buildKeyvaultIdentifier(request.getEndpoint(), secret.name, secret.version),
      value: secret.value,
      contentType: secret.contentType,
      attributes: {
        enabled: secret.attributes!.enabled,
        created: secret.attributes!.created,
        updated: secret.attributes!.updated,
        recoveryLevel: this.recoveryLevel,
        recoverableDays: this.recoverableDays,
        expires: secret.attributes?.expires,
        notBefore: secret.attributes?.notBefore,
      },
      tags: secret.tags,
      managed: secret.managed,
      kid: secret.kid,
    };

    return response;
  }

  public async getSecretLatestVersion(
    secretName: string,
    options: RequestOptionsBase,
    context: Context,
  ): Promise<Models.GetSecretLatestVersionResponse> {
    return await this.getSecret(secretName, "", options, context);
  }

  public async getSecrets(
    options: Models.VoltServerSecretsGetSecretsOptionalParams,
    context: Context,
  ): Promise<Models.GetSecretsResponse> {
    const secretsContext = new SecretsContext(context);
    const request = secretsContext.request!;

    let marker: PaginationMarker | undefined;
    if (secretsContext.nextMarker) {
      marker = parseNextMarker(secretsContext.nextMarker);
    }

    if (options.maxresults === undefined) {
      options.maxresults = DEFAULT_GET_SECRETS_MAX_RESULTS;
    } else if (options.maxresults > DEFAULT_GET_SECRETS_MAX_RESULTS) {
      throw KeyVaultErrorFactory.getBadParameter(context.contextId, "invalid maxresults");
    }

    const [secrets, nextMarker] = await this.metadataStore.getSecrets(context, options.maxresults, marker);

    let nextLink = null;
    if (nextMarker !== undefined) {
      const $skiptoken = buildSkipToken(buildNextMarker(nextMarker));
      nextLink = `${request.getEndpoint()}/secrets?api-version=${context.context.apiVersion}&$skiptoken=${$skiptoken}`;

      if (options.maxresults < DEFAULT_GET_SECRETS_MAX_RESULTS) {
        nextLink += `&maxresults=${options.maxresults}`;
      }
    }

    const response: Models.GetSecretsResponse = {
      statusCode: 200,
      value: secrets.map((secret) => {
        return {
          id: buildKeyvaultIdentifier(request.getEndpoint(), secret.name, secret.version),
          contentType: secret.contentType,
          attributes: {
            enabled: secret.attributes!.enabled,
            created: secret.attributes!.created,
            updated: secret.attributes!.updated,
            recoveryLevel: this.recoveryLevel,
            recoverableDays: this.recoverableDays,
            expires: secret.attributes?.expires,
            notBefore: secret.attributes?.notBefore,
          },
          tags: secret.tags,
          managed: secret.managed,
          kid: secret.kid,
        };
      }),
      nextLink,
    };

    return response;
  }

  public async getSecretVersions(
    secretName: string,
    options: Models.VoltServerSecretsGetSecretVersionsOptionalParams,
    context: Context,
  ): Promise<Models.GetSecretVersionsResponse> {
    const secretsContext = new SecretsContext(context);
    const request = secretsContext.request!;

    let marker: PaginationMarker | undefined;
    if (secretsContext.nextMarker) {
      marker = parseNextMarker(secretsContext.nextMarker);
    }

    if (options.maxresults === undefined) {
      options.maxresults = DEFAULT_GET_SECRET_VERSIONS_MAX_RESULTS;
    } else if (options.maxresults > DEFAULT_GET_SECRET_VERSIONS_MAX_RESULTS) {
      throw KeyVaultErrorFactory.getBadParameter(context.contextId, "invalid maxresults");
    }

    const [secrets, nextMarker] = await this.metadataStore.getSecretVersions(
      context,
      secretName,
      options.maxresults,
      marker,
    );

    let nextLink = null;
    if (nextMarker !== undefined) {
      const $skiptoken = buildSkipToken(buildNextMarker(nextMarker));
      nextLink = `${request.getEndpoint()}/secrets/${secretName}/versions?api-version=${
        context.context.apiVersion
      }&$skiptoken=${$skiptoken}`;

      if (options.maxresults < DEFAULT_GET_SECRET_VERSIONS_MAX_RESULTS) {
        nextLink += `&maxresults=${options.maxresults}`;
      }
    }

    const response: Models.GetSecretVersionsResponse = {
      statusCode: 200,
      value: secrets.map((secret) => {
        return {
          id: buildKeyvaultIdentifier(request.getEndpoint(), secret.name, secret.version),
          contentType: secret.contentType,
          attributes: {
            enabled: secret.attributes!.enabled,
            created: secret.attributes!.created,
            updated: secret.attributes!.updated,
            recoveryLevel: this.recoveryLevel,
            recoverableDays: this.recoverableDays,
            expires: secret.attributes?.expires,
            notBefore: secret.attributes?.notBefore,
          },
          tags: secret.tags,
          managed: secret.managed,
          kid: secret.kid,
        };
      }),
      nextLink,
    };

    return response;
  }

  getDeletedSecrets(
    options: Models.VoltServerSecretsGetDeletedSecretsOptionalParams,
    context: Context,
  ): Promise<Models.GetDeletedSecretsResponse> {
    throw new NotImplementedError();
  }

  public async getDeletedSecret(
    secretName: string,
    options: RequestOptionsBase,
    context: Context,
  ): Promise<Models.GetDeletedSecretResponse> {
    const secretsContext = new SecretsContext(context);
    const request = secretsContext.request!;

    const deletedSecret = await this.metadataStore.getDeletedSecret(context, secretName);

    const response: Models.DeleteSecretResponse = {
      statusCode: 200,
      id: buildKeyvaultIdentifier(request.getEndpoint(), deletedSecret.name, deletedSecret.version),
      contentType: deletedSecret.contentType,
      recoveryId: deletedSecret.recoveryId,
      deletedDate: deletedSecret.deletedDate,
      scheduledPurgeDate: deletedSecret.scheduledPurgeDate,
      attributes: {
        enabled: deletedSecret.attributes!.enabled,
        created: deletedSecret.attributes!.created,
        updated: deletedSecret.attributes!.updated,
        recoveryLevel: this.recoveryLevel,
        recoverableDays: this.recoverableDays,
        expires: deletedSecret.attributes?.expires,
        notBefore: deletedSecret.attributes?.notBefore,
      },
      tags: deletedSecret.tags,
      managed: deletedSecret.managed,
      kid: deletedSecret.kid,
    };

    return response;
  }

  purgeDeletedSecret(secretName: string, options: RequestOptionsBase, context: Context): Promise<RestResponse> {
    throw new NotImplementedError();
  }
  recoverDeletedSecret(
    secretName: string,
    options: RequestOptionsBase,
    context: Context,
  ): Promise<Models.RecoverDeletedSecretResponse> {
    throw new NotImplementedError();
  }
  backupSecret(
    secretName: string,
    options: RequestOptionsBase,
    context: Context,
  ): Promise<Models.BackupSecretResponse> {
    throw new NotImplementedError();
  }
  restoreSecret(
    secretBundleBackup: Uint8Array,
    options: RequestOptionsBase,
    context: Context,
  ): Promise<Models.RestoreSecretResponse> {
    throw new NotImplementedError();
  }

  private async checkSecretIsDeleted(secretName: string, context: Context): Promise<void> {
    const deleted = await this.metadataStore.deletedSecretExists(context, secretName);

    if (deleted) {
      // if secret exists but is deleted, throw error
      throw KeyVaultErrorFactory.getSecretIsDeletedButRecoverable(context.contextId, secretName);
    }
  }
}
