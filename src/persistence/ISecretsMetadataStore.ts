import ICleaner from "../ICleaner";
import IDataStore from "../IDataStore";
import * as Models from "../generated/artifacts/models";
import Context from "../generated/Context";
import { PaginationMarker } from "../utils/pagination";

interface ISecretAdditionalProperties {
  name: string;
  version: string;
}

export type SecretModel = ISecretAdditionalProperties & Models.SecretBundle;
export type DeletedSecretModel = ISecretAdditionalProperties & Models.DeletedSecretBundle;

export type DeleteSecretProperties = Omit<Models.DeletedSecretBundle, keyof Models.SecretBundle>;

/**
 * Persistency layer metadata storage interface.
 *
 *
 * @export
 * @interface ISecretsMetadataStore
 * @extends {IDataStore}
 */
export interface ISecretsMetadataStore extends IDataStore, ICleaner {
  /**
   * Helper function to check whether secret exists.
   *
   * @param {Context} context
   * @param {string} secretName
   * @returns {Promise<boolean>}
   * @memberof ISecretsMetadataStore
   */
  secretExists(context: Context, secretName: string): Promise<boolean>;

  /**
   * Helper function to check whether deletedsecret exists.
   *
   * @param {Context} context
   * @param {string} secretName
   * @returns {Promise<boolean>}
   * @memberof ISecretsMetadataStore
   */
  deletedSecretExists(context: Context, secretName: string): Promise<boolean>;

  /**
   * Set secret.
   *
   * @param {Context} context
   * @param {SecretModel} secret
   * @returns {Promise<SecretModel>}
   * @memberof ISecretsMetadataStore
   */
  setSecret(context: Context, secret: SecretModel): Promise<SecretModel>;

  /**
   * Delete secret.
   *
   * @param {Context} context
   * @param {DeletedSecretModel} secret
   * @param {boolean} disableSoftDelete
   * @returns {Promise<DeletedSecretModel>}
   * @memberof ISecretsMetadataStore
   */
  deleteSecret(
    context: Context,
    secretName: string,
    properties: DeleteSecretProperties,
    disableSoftDelete: boolean,
  ): Promise<DeletedSecretModel>;

  /**
   * Update secret.
   *
   * @param {Context} context
   * @param {string} secretName
   * @param {string} secretVersion
   * @param {Models.VoltServerSecretsUpdateSecretOptionalParams} parameters
   * @returns {Promise<Models.UpdateSecretResponse>}
   * @memberof ISecretsMetadataStore
   */
  updateSecret(context: Context, model: SecretModel): Promise<SecretModel>;

  /**
   * Get secret. If version not provided, get the latest version.
   *
   * @param {Context} context
   * @param {string} secretName
   * @param {string} [secretVersion]
   * @returns {Promise<Models.GetSecretResponse>}
   * @memberof ISecretsMetadataStore
   */
  getSecret(context: Context, secretName: string, secretVersion?: string): Promise<SecretModel>;

  /**
   * Get secrets.
   *
   * @param {Context} context
   * @param {number} maxResults
   * @param {PaginationMarker} [marker]
   * @returns {Promise<[SecretModel[], PaginationMarker?]>}
   * @memberof ISecretsMetadataStore
   */
  getSecrets(
    context: Context,
    maxResults: number,
    marker?: PaginationMarker,
  ): Promise<[SecretModel[], PaginationMarker?]>;

  /**
   * Get secret versions.
   *
   * @param {Context} context
   * @param {string} secretName
   * @param {number} maxResults
   * @param {string} marker
   * @returns {Promise<[SecretModel[], string | undefined]>}
   * @memberof ISecretsMetadataStore
   */
  getSecretVersions(
    context: Context,
    secretName: string,
    maxResults: number,
    marker?: PaginationMarker,
  ): Promise<[SecretModel[], PaginationMarker?]>;

  // TODO: implement the following methods
  // /**
  //  * Get seleted secrets.
  //  *
  //  * @param {Context} context
  //  * @returns {Promise<void>}
  //  * @memberof ISecretsMetadataStore
  //  */
  // getDeletedSecrets(
  //   context: Context,
  // ): Promise<void>;

  /**
   * Get deleted secret.
   *
   * @param {Context} context
   * @param {string} secretName
   * @returns {Promise<DeletedSecretModel>}
   * @memberof ISecretsMetadataStore
   */
  getDeletedSecret(context: Context, secretName: string): Promise<DeletedSecretModel>;

  // /**
  //  * Recover deleted secret.
  //  *
  //  * @param {Context} context
  //  * @returns {Promise<void>}
  //  * @memberof ISecretsMetadataStore
  //  */
  // recoverDeletedSecret(
  //   context: Context,
  // ): Promise<void>;

  // /**
  //  * Backup secret.
  //  *
  //  * @param {Context} context
  //  * @returns {Promise<void>}
  //  * @memberof ISecretsMetadataStore
  //  */
  // backupSecret(
  //   context: Context,
  // ): Promise<void>;

  // /**
  //  * Restore secret.
  //  *
  //  * @param {Context} context
  //  * @returns {Promise<void>}
  //  * @memberof ISecretsMetadataStore
  //  */
  // restoreSecret(
  //   context: Context,
  // ): Promise<void>;
}

export default ISecretsMetadataStore;
