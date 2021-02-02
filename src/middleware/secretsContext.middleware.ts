import { NextFunction, Request, RequestHandler, Response } from "express";
import { v4 as uuid } from "uuid";

import logger from "../Logger";
import SecretsContext from "../context/SecretsContext";
import { DEFAULT_CONTEXT_PATH, ParameterConstants, LatestStableAPIVersion, ValidAPIVersions } from "../utils/constants";
import { checkApiVersion } from "../utils/utils";
import { decodeSkipToken, SkipToken } from "../utils/pagination";
import KeyVaultErrorFactory from "../errors/KeyVaultErrorFactory";

export default function createSecretsContextMiddleware(skipApiVersionCheck?: boolean): RequestHandler {
  return (req: Request, res: Response, next: NextFunction) => {
    return secretsContextMiddleware(req, res, next, skipApiVersionCheck);
  };
}

/**
 * A middleware extract related secrets context.
 *
 * @export
 * @param {Request} req An express compatible Request object
 * @param {Response} res An express compatible Response object
 * @param {NextFunction} next An express middleware next callback
 */
export function secretsContextMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
  skipApiVersionCheck?: boolean,
): void {
  const requestID = uuid();
  const apiVersion = req.query[ParameterConstants.API_VERSION] as string;
  const $skipToken = req.query[ParameterConstants.SKIP_TOKEN] as string;

  if (!skipApiVersionCheck) {
    if (apiVersion == undefined) {
      const handlerError = KeyVaultErrorFactory.getBadParameter(
        `${ParameterConstants.API_VERSION} must be specified`,
        requestID,
      );

      logger.error(`SecretsContextMiddleware: ${handlerError.message}`, requestID);

      return next(handlerError);
    }
    checkApiVersion(apiVersion, ValidAPIVersions, LatestStableAPIVersion, requestID);
  }

  let nextMarker = undefined;

  // Decode $skiptoken query parameter. Used for fetching next results in paginated responses.
  if ($skipToken !== undefined) {
    try {
      const decodedSkipToken: SkipToken = decodeSkipToken($skipToken);
      nextMarker = decodedSkipToken.NextMarker;
    } catch (err) {
      logger.warn(
        `SecretsContextMiddleware: Failed to decode $skiptoken '${$skipToken}' Error: ${err.message}`,
        requestID,
      );
    }
  }

  const secretsContext = new SecretsContext(res.locals, DEFAULT_CONTEXT_PATH);

  secretsContext.apiVersion = apiVersion;
  secretsContext.startTime = new Date();
  secretsContext.xMsRequestID = requestID;
  secretsContext.nextMarker = nextMarker;

  logger.info(
    `SecretsContextMiddleware: RequestMethod=${req.method} RequestURL=${req.protocol}://${req.hostname}${
      req.url
    } RequestHeaders:${JSON.stringify(req.headers)} ClientIP=${req.ip} Protocol=${req.protocol} HTTPVersion=${
      req.httpVersion
    }`,
    requestID,
  );

  next();
}
