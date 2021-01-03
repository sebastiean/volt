import { stat } from "fs";
import Loki from "lokijs";

import { rimrafAsync } from "../utils/utils";
import * as Models from "../generated/artifacts/models";
import Context from "../generated/Context";
import ISecretsMetadataStore, { SecretModel } from "./ISecretsMetadataStore";
import KeyVaultErrorFactory from '../errors/KeyVaultErrorFactory';

/**
 * This is a metadata source implementation for secrets based on loki DB.
 *
 * Loki DB includes following collections and documents:
 *
 * -- SECRETS_COLLECTION     // Collection contains all secrets
 *                           // Default collection name is $SECRETS_COLLECTION$
 *                           // Each document maps to a secret
 *                           // Unique document properties: secretName
 *
 * @export
 * @class LokiSecretsMetadataStore
 */
export default class LokiSecretsMetadataStore
  implements ISecretsMetadataStore {
  private readonly db: Loki;

  private initialized: boolean = false;
  private closed: boolean = true;

  private readonly SECRETS_COLLECTION = "$SECRETS_COLLECTION$";

  public constructor(public readonly lokiDBPath: string) {
    this.db = new Loki(lokiDBPath, {
      autosave: true,
      autosaveInterval: 5000
    });
  }

  public isInitialized(): boolean {
    return this.initialized;
  }

  public isClosed(): boolean {
    return this.closed;
  }

  public async init(): Promise<void> {
    await new Promise<void>((resolve, reject) => {
      stat(this.lokiDBPath, (statError, stats) => {
        if (!statError) {
          this.db.loadDatabase({}, dbError => {
            if (dbError) {
              reject(dbError);
            } else {
              resolve();
            }
          });
        } else {
          // when DB file doesn't exist, ignore the error because following will re-create the file
          resolve();
        }
      });
    });

    // In loki DB implementation, these operations are all sync. Doesn't need an async lock

    // Create secrets collection if not exists
    let secretsColl = this.db.getCollection(this.SECRETS_COLLECTION);
    if (secretsColl === null) {
      secretsColl = this.db.addCollection(this.SECRETS_COLLECTION, {
        unique: ["secretName"],
        // Optimization for indexing and searching
        // https://rawgit.com/techfort/LokiJS/master/jsdoc/tutorial-Indexing%20and%20Query%20performance.html
        indices: ["secretName"]
      });
    }

    await new Promise<void>((resolve, reject) => {
      this.db.saveDatabase(err => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });

    this.initialized = true;
    this.closed = false;
  }

  /**
   * Close loki DB.
   *
   * @returns {Promise<void>}
   * @memberof LokiSecretsMetadataStore
   */
  public async close(): Promise<void> {
    await new Promise<void>((resolve, reject) => {
      this.db.close(err => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });

    this.closed = true;
  }

  /**
   * Clean LokiSecretsMetadataStore.
   *
   * @returns {Promise<void>}
   * @memberof LokiSecretsMetadataStore
   */
  public async clean(): Promise<void> {
    if (this.isClosed()) {
      await rimrafAsync(this.lokiDBPath);

      return;
    }
    throw new Error(`Cannot clean LokiSecretsMetadataStore, it's not closed.`);
  }

  private sortVersionsByDate(versions: any[]): any[] {
    return versions.slice().sort((a: any, b: any) => {
      return new Date(b.attributes.created).getTime() - new Date(a.attributes.created).getTime();
    });
  }

  private sortVersionsByVersion(versions: any[]): any[] {
    return versions.slice().sort((a: any, b: any) => {
      return a.secretVersion > b.secretVersion ? 1 : -1;
    });
  }

  private binarySearchVersions(arr: any[], x: string, start: number, end: number): number {
    if (x === "") return -1;
    if (start > end) return -1;
    let mid = Math.floor((start + end) / 2);
    if (arr[mid].secretVersion === x) return mid;
    if (arr[mid].secretVersion > x) {
      return this.binarySearchVersions(arr, x, start, mid - 1);
    }
    else {
      return this.binarySearchVersions(arr, x, mid + 1, end);
    }
  }

  /**
   * Set secret item in persistency layer. Will create new version if secret exists.
   *
   * @param {Context} context
   * @param {SecretModel} secret
   * @returns {Promise<SecretModel>}
   * @memberof LokiSecretsMetadataStore
   */
  public async setSecret(context: Context, secret: SecretModel): Promise<SecretModel> {
    const coll = this.db.getCollection(this.SECRETS_COLLECTION);
    const secretDoc = coll.findOne({
      secretName: secret.secretName
    });

    // validateParameters(context, parameters, secretDoc);

    if (secretDoc) {
      secretDoc.versions.push(secret);
      return coll.update(secretDoc);
    }

    return coll.insert({
      secretName: secret.secretName,
      versions: [secret]
    });
  }

  public async deleteSecret(context: Context, secretName: string): Promise<Models.DeleteSecretResponse> {
    throw new Error("Method not implemented.");
  }

  public async updateSecret(context: Context, secret: SecretModel): Promise<SecretModel> {
    const coll = this.db.getCollection(this.SECRETS_COLLECTION);
    const secretDoc = coll.findOne({
      secretName: secret.secretName
    });

    if (!secretDoc) {
      throw KeyVaultErrorFactory.getSecretNotFound(context.contextId, secret.secretName);
    }

    let found = undefined;

    for (let i = 0; i < secretDoc.versions.length; i++) {
      if (secretDoc.versions[i].secretVersion === secret.secretVersion) {
        found = i;
        break;
      }
    }

    if (found === undefined) {
      throw KeyVaultErrorFactory.getSecretNotFound(context.contextId, secret.secretName, secret.secretVersion);
    }

    secretDoc.versions[found] = { ...secretDoc.versions[found], ...secret };
    coll.update(secretDoc);

    return secretDoc.versions[found];
  }

  public async getSecret(context: Context, secretName: string, secretVersion?: string): Promise<SecretModel> {
    const coll = this.db.getCollection(this.SECRETS_COLLECTION);
    const secretDoc = coll.findOne({
      secretName
    });

    if (!secretDoc) {
      throw KeyVaultErrorFactory.getSecretNotFound(context.contextId, secretName);
    }

    // If we have been provided a version, search for it.
    if (secretVersion) {
      for (let i = 0; i < secretDoc.versions.length; i++) {
        if (secretDoc.versions[i].secretVersion = secretVersion) {
          if (secretDoc.versions[i].attributes.enabled === false) {
            throw KeyVaultErrorFactory.getDisabledSecret(context.contextId);
          }

          return secretDoc.versions[i] as SecretModel;
        }
      }

      throw KeyVaultErrorFactory.getSecretNotFound(context.contextId, secretName, secretVersion);
    }

    // Otherwise, get the latest by creation date
    const sortedVersions = this.sortVersionsByDate(secretDoc.versions);

    for (const sorted of sortedVersions) {
      if (sorted.attributes.enabled === true) {
        return sorted as SecretModel;
      }
    }

    throw KeyVaultErrorFactory.getDisabledSecret(context.contextId);
  }

  public async getSecrets(context: Context, maxResults: number, marker: string = ""): Promise<[SecretModel[], string | undefined]> {
    const coll = this.db.getCollection(this.SECRETS_COLLECTION);

    if (marker !== "") {
      const subId = marker.split("!")[1];
      const parts = subId.split("/");
      marker = parts[parts.length - 1].toLowerCase();
    }

    const docs = await coll
      .chain()
      .where(obj => {
        return obj.secretName >= marker!;
      })
      .simplesort("secretName")
      .limit(maxResults + 1)
      .data();

    if (docs.length <= maxResults) {
      return [
        docs.map(doc => {
          const sortedVersions = this.sortVersionsByDate(doc.versions);
          for (const sorted of sortedVersions) {
            if (sorted.attributes.enabled === true) {
              return sorted as SecretModel;
            }
          }
          return sortedVersions[0];
        }),
        undefined
      ];
    } else {
      const markerIndex = docs.length - 1;
      const marker = `secret/${docs[markerIndex].secretName}`;
      const paddedIndex = String(markerIndex).padStart(6, '0');
      const nextMarker = [paddedIndex, marker, "000028", "9999-12-31T23:59:59.9999999Z", ""].join("!");

      docs.pop();

      return [
        docs.map(doc => {
          const sortedVersions = this.sortVersionsByDate(doc.versions);
          for (const sorted of sortedVersions) {
            if (sorted.attributes.enabled === true) {
              return sorted as SecretModel;
            }
          }
          return sortedVersions[0];
        }),
        nextMarker
      ];
    }
  }

  public async getSecretVersions(context: Context, secretName: string, maxResults: number, marker: string = ""): Promise<[SecretModel[], string | undefined]> {
    const coll = this.db.getCollection(this.SECRETS_COLLECTION);
    const secretDoc = coll.findOne({
      secretName
    });

    if (!secretDoc) {
      throw KeyVaultErrorFactory.getSecretNotFound(context.contextId, secretName);
    }

    if (marker !== "") {
      const subId = marker.split("!")[1];
      const parts = subId.split("/");
      marker = parts[parts.length - 1].toLowerCase();
    }

    const sortedVersions = this.sortVersionsByVersion(secretDoc.versions);

    let index = this.binarySearchVersions(sortedVersions, marker, 0, sortedVersions.length - 1);

    if (index === -1) {
      index = 0;
    }

    let max = index + maxResults;

    if (sortedVersions.length < max) {
      max = sortedVersions.length;
    }

    const slicedVersions = sortedVersions.slice(index, max);

    if (sortedVersions.length < (index + maxResults)) {
      return [slicedVersions, undefined];
    } else {
      const markerIndex = max;
      const marker = `secret/${secretName}/${sortedVersions[markerIndex].secretVersion}`;
      const paddedIndex = String(markerIndex).padStart(6, '0');
      const nextMarker = [paddedIndex, marker, "000028", "9999-12-31T23:59:59.9999999Z", ""].join("!");

      return [slicedVersions, nextMarker];
    }
  }
}