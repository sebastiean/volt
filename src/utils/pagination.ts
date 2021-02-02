import { DEFAULT_NEXT_MARKER_ID, DEFAULT_NEXT_MARKER_DATE } from "./constants";

export interface SkipToken {
  NextMarker?: string;
  TargetLocation?: number;
}

export interface ItemIdentifier {
  collection: string;
  name: string;
  version?: string;
}

export interface PaginationMarker {
  index: number;
  itemIdentifier: ItemIdentifier;
}

export function decodeSkipToken($skiptoken: string): SkipToken {
  const json = Buffer.from($skiptoken, "base64").toString("utf-8");
  return JSON.parse(json) as SkipToken;
}

/**
 * Splits and parses a nextMarker string containing a base64 encoded marker.
 *
 * Example: 2!144!MDAwMDYyIXNlY3JldC9MSVNUU0VDUkVUVkVSU0lPTlNURVNULzFENDk2MkIxRUQ3ODREQkY4OTlGMzMzMkU0NzY4QjcwITAwMDAyOCE5OTk5LTEyLTMxVDIzOjU5OjU5Ljk5OTk5OTlaIQ--
 * Example parsed: 000022!secret/LISTSECRETTEST1!000028!2016-12-19T23:10:45.8818110Z!
 *
 * @param {string} nextMarker
 * @returns {PaginationMarker}
 */
export function parseNextMarker(nextMarker: string): PaginationMarker | undefined {
  const parts = nextMarker.split("!");

  if (parts.length === 0) {
    return undefined;
  }

  // Last split part contains the marker in Base64 format
  const marker = Buffer.from(parts[parts.length - 1], "base64").toString("utf-8");
  const markerParts = marker.split("!");

  const identifier = markerParts[1].toLowerCase().split("/");

  const itemIdentifier = {
    collection: identifier[0],
    name: identifier[1],
    version: identifier[2] || undefined,
  };

  return {
    index: parseInt(markerParts[0]),
    itemIdentifier,
  };
}

/**
 * Builds a NextMarker string from PaginationMarker.
 *
 * Example: 000010!secret/ABC!000028!9999-12-31T23:59:59.9999999Z!
 * Example built: 2!144!MDAwMDEwIXNlY3JldC9BQkMhMDAwMDI4ITk5OTktMTItMzFUMjM6NTk6NTkuOTk5OTk5OVoh
 *
 * @param {string} marker
 * @returns {string}
 */
export function buildNextMarker(marker: PaginationMarker): string {
  const itemIdentifierParts = [marker.itemIdentifier.collection, marker.itemIdentifier.name.toUpperCase()];

  if (marker.itemIdentifier.version) {
    itemIdentifierParts.push(marker.itemIdentifier.version.toUpperCase());
  }

  const itemIdentifier = itemIdentifierParts.join("/");
  const paddedIndex = String(marker.index).padStart(6, "0");

  const builtMarker = [paddedIndex, itemIdentifier, DEFAULT_NEXT_MARKER_ID, DEFAULT_NEXT_MARKER_DATE].join("!");
  const encodedMarker = Buffer.from(builtMarker).toString("base64");

  return [2, 144, encodedMarker].join("!");
}

/**
 * Builds a base64 encoded skiptoken string from a NextMarker string and TargetLocation.
 *
 * @param {string} nextMarker
 * @param {number} [targetLocation]
 * @returns {string}
 */
export function buildSkipToken(nextMarker: string, targetLocation = 0): string {
  const skipToken: SkipToken = {
    NextMarker: nextMarker,
    TargetLocation: targetLocation,
  };

  const json = JSON.stringify(skipToken);

  return Buffer.from(json).toString("base64");
}
