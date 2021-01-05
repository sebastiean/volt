import { OutgoingHttpHeaders } from 'http';
import rimraf = require("rimraf");
import { promisify } from "util";
import KeyVaultErrorFactory from '../errors/KeyVaultErrorFactory';
import { HeaderConstants, HeaderValueConstants } from "./constants";

// LokiFsStructuredAdapter
// tslint:disable-next-line:no-var-requires
export const lfsa = require("lokijs/src/loki-fs-structured-adapter.js");

export const rimrafAsync = promisify(rimraf);

export interface SkipToken {
  NextMarker?: string;
  TargetLocation?: number;
}

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

export function decodeSkipToken(
  $skiptoken: string
): SkipToken {
  const json = Buffer.from($skiptoken, 'base64').toString('utf-8');
  return JSON.parse(json) as SkipToken;
}

/**
 * Splits and parses a nextMarker string containing a base64 encoded marker.
 * 
 * Example: 2!144!MDAwMDYyIXNlY3JldC9MSVNUU0VDUkVUVkVSU0lPTlNURVNULzFENDk2MkIxRUQ3ODREQkY4OTlGMzMzMkU0NzY4QjcwITAwMDAyOCE5OTk5LTEyLTMxVDIzOjU5OjU5Ljk5OTk5OTlaIQ--
 * Example parsed: 000022!secret/LISTSECRETTEST1!000028!2016-12-19T23:10:45.8818110Z!
 * 
 * @param {string} nextMarker
 * @returns {string}
 */
export function parseNextMarker(
  nextMarker: string
): string {
  const parts = nextMarker.split("!");

  if (!parts) {
    return "";
  }

  // Last split part contains the marker in Base64 format
  const marker = Buffer.from(parts[parts.length - 1], 'base64').toString('utf-8');
  return marker;
}

/**
 * Builds a NextMarker string from a marker string.
 * 
 * Example: 000010!secret/ABC!000028!9999-12-31T23:59:59.9999999Z!
 * Example built: 2!56!MDAwMDEwIXNlY3JldC9BQkMhMDAwMDI4ITk5OTktMTItMzFUMjM6NTk6NTkuOTk5OTk5OVoh
 * 
 * @param {string} marker
 * @returns {string}
 */
export function buildNextMarker(
  marker: string
): string {
  const encoded = Buffer.from(marker).toString('base64');
  const parts = [2, 56, encoded];

  return parts.join("!");
}

/**
 * Builds a base64 encoded skiptoken string from a NextMarker string and TargetLocation.
 * 
 * @param {string} nextMarker
 * @returns {string}
 */
export function buildSkipToken(
  nextMarker: string,
  targetLocation?: number
): string {
  if (targetLocation === undefined) {
    targetLocation = 0;
  }

  const skipToken = {
    NextMarker: nextMarker,
    TargetLocation: targetLocation
  } as SkipToken;

  const json = JSON.stringify(skipToken);

  return Buffer.from(json).toString('base64');
}

export function getDefaultHeaders(): OutgoingHttpHeaders {
  return {
    [HeaderConstants.X_MS_KEYVAULT_SERVICE_VERSION]: HeaderValueConstants[HeaderConstants.X_MS_KEYVAULT_SERVICE_VERSION],
    [HeaderConstants.X_MS_KEYVAULT_REGION]: HeaderValueConstants[HeaderConstants.X_MS_KEYVAULT_REGION],
    [HeaderConstants.X_MS_KEYVAULT_NETWORK_INFO]: HeaderValueConstants[HeaderConstants.X_MS_KEYVAULT_NETWORK_INFO],
  };
}