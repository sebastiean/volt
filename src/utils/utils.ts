import rimraf = require("rimraf");
import { promisify } from "util";
import KeyVaultErrorFactory from '../errors/KeyVaultErrorFactory';

// LokiFsStructuredAdapter
// tslint:disable-next-line:no-var-requires
export const lfsa = require("lokijs/src/loki-fs-structured-adapter.js");

export const rimrafAsync = promisify(rimraf);

export function checkApiVersion(
  inputApiVersion: string,
  validApiVersions: Array<string>,
  latestStableApiVersion: string,
  requestId: string
): void {
  if (!validApiVersions.includes(inputApiVersion)) {
    const message = `The specified version (${inputApiVersion}) is not recognized. Consider using the latest supported version (${latestStableApiVersion}).`;
    throw KeyVaultErrorFactory.getBadParameter(requestId, message);
  }
}

export function getTimestampInSeconds(date?: Date): Number {
  if (!date) {
    date = new Date();
  }

  return Math.floor((date).getTime() / 1000);
}

export function buildKeyvaultIdentifier(
  vaultBaseUrl: string,
  secretName: string,
  secretVersion: string,
  collection: string = "secrets"
): string {
  const url = vaultBaseUrl.endsWith("/")
    ? vaultBaseUrl.substr(0, vaultBaseUrl.length - 2)
    : vaultBaseUrl; // Remove last "/"

  return [url, collection, secretName, secretVersion].join("/");
}