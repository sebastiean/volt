import { readFileSync } from "fs";
import { sign } from "jsonwebtoken";
import { URL } from "url";

export const MD5_REGEX = /^[a-f0-9]{32}$/;

export function getUniqueName(prefix: string): string {
  const randomInt = Math.floor(Math.random() * 10000).toString();

  return `${prefix}${new Date().getTime()}${String(randomInt).padStart(5, '0')}`;
}

export function base64encode(content: string): string {
  return Buffer.from(content).toString("base64");
}

/**
 * Append a string to URL path. Will remove duplicated "/" in front of the string
 * when URL path ends with a "/".
 *
 * @export
 * @param {string} url Source URL string
 * @param {string} name String to be appended to URL
 * @returns {string} An updated URL string
 */
export function appendToURLPath(url: string, name: string): string {
  const urlParsed = new URL(url);

  let path = urlParsed.pathname;
  path = path
    ? path.endsWith("/")
      ? `${path}${name}`
      : `${path}/${name}`
    : name;
  urlParsed.pathname = path;

  return urlParsed.href;
}

export function generateJWTToken(
  nbf: Date,
  iat: Date,
  exp: Date,
  iss: string,
  aud: string,
  sub: string
) {
  const privateKey = readFileSync("./tests/server-key.pem");
  const token = sign(
    {
      nbf: Math.floor(nbf.getTime() / 1000),
      iat: Math.floor(iat.getTime() / 1000),
      exp: Math.floor(exp.getTime() / 1000),
      iss,
      aud,
      idp: iss,
      sub,
      oid: sub
    },
    privateKey,
    { algorithm: "RS256" }
  );
  return token;
}
