import { NextFunction, Request, RequestHandler, Response } from "express";
import { v4 as uuid } from "uuid";

import logger from "../Logger";
import SecretsContext from "../context/SecretsContext";
import {
  DEFAULT_CONTEXT_PATH,
  ParameterConstants,
  LatestStableAPIVersion,
  ValidAPIVersions
} from "../utils/constants";
import { checkApiVersion } from "../utils/utils";
import KeyVaultErrorFactory from '../errors/KeyVaultErrorFactory';

export default function createSecretsContextMiddleware(
  skipApiVersionCheck?: boolean
): RequestHandler {
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
  skipApiVersionCheck?: boolean
): void {
  const requestID = uuid();

  if (!skipApiVersionCheck) {
    const apiVersion = req.query[ParameterConstants.API_VERSION] as string;
    if (apiVersion == undefined) {
      const handlerError = KeyVaultErrorFactory.getBadParameter(
        `${ParameterConstants.API_VERSION} must be specified`,
        requestID
      );

      logger.error(
        `SecretsContextMiddleware: ${handlerError.message}`,
        requestID
      );

      return next(handlerError);
    }
    checkApiVersion(apiVersion, ValidAPIVersions, LatestStableAPIVersion, requestID);
  }

  const secretsContext = new SecretsContext(res.locals, DEFAULT_CONTEXT_PATH);
  secretsContext.startTime = new Date();

  secretsContext.xMsRequestID = requestID;

  logger.info(
    `SecretsContextMiddleware: RequestMethod=${req.method} RequestURL=${req.protocol
    }://${req.hostname}${req.url} RequestHeaders:${JSON.stringify(
      req.headers
    )} ClientIP=${req.ip} Protocol=${req.protocol} HTTPVersion=${req.httpVersion
    }`,
    requestID
  );

  next();
}