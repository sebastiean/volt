import { OutgoingHttpHeaders } from "http";
import rimraf = require("rimraf");
import { promisify } from "util";
import KeyVaultErrorFactory from "../errors/KeyVaultErrorFactory";
import { HeaderConstants, HeaderValueConstants } from "./constants";

// LokiFsStructuredAdapter
// tslint:disable-next-line:no-var-requires
export const lfsa = require("lokijs/src/loki-fs-structured-adapter.js");

export const rimrafAsync = promisify(rimraf);

export function checkApiVersion(
  inputApiVersion: string,
  validApiVersions: Array<string>,
  latestStableApiVersion: string,
  requestId: string,
): void {
  if (!validApiVersions.includes(inputApiVersion)) {
    const message = `The specified version (${inputApiVersion}) is not recognized. Consider using the latest supported version (${latestStableApiVersion}).`;
    throw KeyVaultErrorFactory.getBadParameter(requestId, message);
  }
}

export function getTimestampInSeconds(date?: Date): number {
  if (!date) {
    date = new Date();
  }

  return Math.floor(date.getTime() / 1000);
}

export function buildKeyvaultIdentifier(
  vaultBaseUrl: string,
  secretName: string,
  secretVersion: string,
  collection = "secrets",
): string {
  const url = vaultBaseUrl.endsWith("/") ? vaultBaseUrl.substr(0, vaultBaseUrl.length - 2) : vaultBaseUrl; // Remove last "/"

  return [url, collection, secretName, secretVersion].join("/");
}

export function buildRecoveryIdentifier(
  vaultBaseUrl: string,
  secretName: string,
  collection = "deletedsecrets",
): string {
  const url = vaultBaseUrl.endsWith("/") ? vaultBaseUrl.substr(0, vaultBaseUrl.length - 2) : vaultBaseUrl; // Remove last "/"

  return [url, collection, secretName].join("/");
}

export function getScheduledPurgeDate(deletedDate: Date, recoverableDays: number): Date {
  const scheduledPurgeDate = new Date(deletedDate);
  scheduledPurgeDate.setDate(scheduledPurgeDate.getDate() + recoverableDays);
  return scheduledPurgeDate;
}

export function getDefaultHeaders(): OutgoingHttpHeaders {
  return {
    [HeaderConstants.X_MS_KEYVAULT_SERVICE_VERSION]:
      HeaderValueConstants[HeaderConstants.X_MS_KEYVAULT_SERVICE_VERSION],
    [HeaderConstants.X_MS_KEYVAULT_REGION]: HeaderValueConstants[HeaderConstants.X_MS_KEYVAULT_REGION],
    [HeaderConstants.X_MS_KEYVAULT_NETWORK_INFO]: HeaderValueConstants[HeaderConstants.X_MS_KEYVAULT_NETWORK_INFO],
  };
}
