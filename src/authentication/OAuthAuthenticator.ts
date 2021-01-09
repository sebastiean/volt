import { decode } from "jsonwebtoken";
import ILogger from "../ILogger";
import { OAuthLevel } from "../models";
import {
  BEARER_TOKEN_PREFIX,
  HTTPS,
  VALID_ISSUE_PREFIXES
} from "../utils/constants";
import SecretsContext from "../context/SecretsContext";
import KeyVaultErrorFactory from "../errors/KeyVaultErrorFactory";
import Context from "../generated/Context";
import IRequest from "../generated/IRequest";
import { HeaderConstants, VALID_KEY_VAULT_AUDIENCES } from "../utils/constants";
import IAuthenticator from "./IAuthenticator";
import ServerError from '../errors/ServerError';
import KeyVaultError from '../errors/KeyVaultError';

export default class OAuthAuthenticator implements IAuthenticator {
  public constructor(
    private readonly oauth: OAuthLevel,
    private readonly logger: ILogger
  ) { }

  public async validate(
    req: IRequest,
    context: Context
  ): Promise<boolean | undefined> {
    const secretsContext = new SecretsContext(context);

    this.logger.info(
      `OAuthAuthenticator:validate() Start validation against token authentication.`,
      secretsContext.contextId
    );

    if (req.getProtocol().toLowerCase() !== HTTPS) {
      const message = "Request is not using HTTPS protocol. Volt Server will not respond. Please enable HTTPS to use OAuth.";
      this.logger.error(
        `OAuthAuthenticator:validate() ${message}`,
        secretsContext.contextId
      );
      throw new ServerError(
        503,
        secretsContext.contextId!,
        new KeyVaultError(
          "VoltError",
          message
        )
      );
    }

    const authHeaderValue = req.getHeader(HeaderConstants.AUTHORIZATION);
    if (authHeaderValue === undefined) {
      this.logger.info(
        `OAuthAuthenticator:validate() Request doesn't include valid authentication header.`,
        secretsContext.contextId
      );
      throw KeyVaultErrorFactory.getUnauthorized(secretsContext.contextId);
    }

    if (!authHeaderValue.startsWith(BEARER_TOKEN_PREFIX)) {
      throw KeyVaultErrorFactory.getUnauthorized(secretsContext.contextId);
    }

    const token = authHeaderValue.substr(BEARER_TOKEN_PREFIX.length + 1);

    switch (this.oauth) {
      case OAuthLevel.BASIC:
        return this.authenticateBasic(token, context);
      default:
        this.logger.warn(
          `OAuthAuthenticator:validate() Unknown OAuth level ${this.oauth}. Skip token authentication.`,
          secretsContext.contextId
        );
        return;
    }
  }

  public async authenticateBasic(
    token: string,
    context: Context
  ): Promise<boolean> {
    // tslint:disable: max-line-length
    /**
     * Example OAuth Bearer Token:
     * {
     *    "aud": "https://vault.azure.net",
     *    "iss": "https://sts.windows.net/ab1f708d-50f6-404c-a006-d71b2ac7a606/",
     *    "iat": 1609784872,
     *    "nbf": 1609784872,
     *    "exp": 1609788772,
     *    "aio": "E2JgYPi646//pR0ForYNGwruBypxAQA=",
     *    "appid": "f997392c-e15a-4ad8-af9e-cd6966caba7f",
     *    "appidacr": "1",
     *    "idp": "https://sts.windows.net/ab1f708d-50f6-404c-a006-d71b2ac7a606/",
     *    "oid": "11059fcc-5514-4800-b5f8-49808b9cfab6",
     *    "rh": "0.ATEAMECjGJdqd0COnWWxnzA9lB5zQh7MV9RPuIhd65kcdW8xAAA.",
     *    "sub": "11059fcc-5514-4800-b5f8-49808b9cfab6",
     *    "tid": "18a34030-6a97-4077-8e9d-65b19f303d94",
     *    "uti": "q2gWp4slnkyxJTRRlvbKAA",
     *    "ver": "1.0"
     * }
     */

    // Validate JWT token format
    let decoded;
    try {
      decoded = decode(token) as { [key: string]: any };
    } catch {
      throw KeyVaultErrorFactory.getAuthenticationFailure(
        context.contextId,
        "AKV10003: Unable to parse JWT token: bad JSON content."
      );
    }

    if (!decoded) {
      throw KeyVaultErrorFactory.getAuthenticationFailure(
        context.contextId,
        "AKV10003: Unable to parse JWT token: bad JSON content."
      );
    }

    // Validate signature, skip in basic check

    // Validate nbf & exp
    if (
      decoded.nbf === undefined ||
      decoded.exp === undefined ||
      decoded.iat === undefined
    ) {
      throw KeyVaultErrorFactory.getTokenValidationFailure(
        context.contextId
      );
    }

    const now = context.startTime!.getTime();
    const nbf = (decoded.nbf as number) * 1000;
    const exp = (decoded.exp as number) * 1000;

    if (now < nbf) {
      throw KeyVaultErrorFactory.getTokenValidationFailure(
        context.contextId
      );
    }

    if (now > exp) {
      throw KeyVaultErrorFactory.getTokenValidationFailure(
        context.contextId,
        "IDX10223"
      );
    }

    const iss = decoded.iss as string;
    if (!iss) {
      throw KeyVaultErrorFactory.getTokenValidationFailure(
        context.contextId
      );
    }

    let issMatch = false;
    for (const validIssuePrefix of VALID_ISSUE_PREFIXES) {
      if (iss.startsWith(validIssuePrefix)) {
        issMatch = true;
        break;
      }
    }

    if (!issMatch) {
      throw KeyVaultErrorFactory.getTokenValidationFailure(
        context.contextId
      );
    }

    const aud = decoded.aud as string;
    if (!aud) {
      throw KeyVaultErrorFactory.getTokenValidationFailure(
        context.contextId
      );
    }

    let audMatch = false;
    let m;
    for (const regex of VALID_KEY_VAULT_AUDIENCES) {
      m = regex.exec(aud);
      if (m !== null) {
        if (m[0] === aud) {
          audMatch = true;
          break;
        }
      }
    }

    if (!audMatch) {
      throw KeyVaultErrorFactory.getTokenValidationFailure(
        context.contextId
      );
    }

    this.logger.info(
      `OAuthAuthenticator:authenticateBasic() Validation against token authentication successfully.`,
      context.contextId
    );
    return true;
  }
}
