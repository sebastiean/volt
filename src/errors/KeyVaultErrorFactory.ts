import KeyVaultError from "./KeyVaultError";
import ServerError from "./ServerError";
import { HeaderConstants, HeaderValueConstants } from "../utils/constants";
import { OutgoingHttpHeaders } from 'http';

const DefaultID: string = "DefaultKeyVaultRequestID";
const DefaultWWWAuthenticateHeader: OutgoingHttpHeaders = {
  [HeaderConstants.WWW_AUTHENTICATE]: HeaderValueConstants[HeaderConstants.WWW_AUTHENTICATE]
};

/**
 * A factory class maintains all Azure Key Vault service errors.
 *
 * @export
 * @class KeyVaultErrorFactory
 */
export default class KeyVaultErrorFactory {
  public static getSecretNotFound(
    contextID: string = DefaultID,
    secretName: string,
    secretVersion?: string
  ): ServerError {
    const nameId = secretVersion ? `${secretName}/${secretVersion}` : secretName;
    return new ServerError(
      404,
      contextID,
      new KeyVaultError(
        "SecretNotFound",
        `A secret with (name/id) ${nameId} was not found in this key vault. If you recently deleted this secret you may be able to recover it using the correct recovery command. For help resolving this issue, please see https://go.microsoft.com/fwlink/?linkid=2125182`,
      )
    );
  }

  public static getBadParameter(
    contextID: string = DefaultID,
    message: string
  ): ServerError {
    return new ServerError(
      400,
      contextID,
      new KeyVaultError(
        "BadParameter",
        message
      )
    );
  }

  public static getDisabledSecret(
    contextID: string = DefaultID
  ): ServerError {
    return new ServerError(
      403,
      contextID,
      new KeyVaultError(
        "Forbidden",
        "Operation get is not allowed on a disabled secret.",
        new KeyVaultError(
          "SecretDisabled"
        )
      )
    );
  }

  public static getSecretIsDeletedButRecoverable(
    contextID: string = DefaultID,
    secretName: string
  ): ServerError {
    return new ServerError(
      409,
      contextID,
      new KeyVaultError(
        "Conflict",
        `Secret ${secretName} is currently in a deleted but recoverable state, and its name cannot be reused; in this state, the secret can only be recovered or purged.`,
        new KeyVaultError(
          "ObjectIsDeletedButRecoverable"
        )
      )
    );
  }

  // Purge forbidden
  // 403
  // {
  //   "error": {
  //       "code": "Forbidden",
  //       "message": "The user, group or application 'appid=;oid=;numgroups=23;iss=https://sts.windows.net/[tenant]/' does not have secrets purge permission on key vault '[vault name];location=westeurope'. For help resolving this issue, please see https://go.microsoft.com/fwlink/?linkid=2125287",
  //       "innererror": {
  //           "code": "ForbiddenByPolicy"
  //       }
  //   }
  // }

  public static getUnauthorized(
    contextID: string = DefaultID
  ): ServerError {
    return new ServerError(
      401,
      contextID,
      new KeyVaultError(
        "Unauthorized",
        "Request is missing a Bearer or PoP token.",
      ),
      DefaultWWWAuthenticateHeader
    );
  }

  public static getAuthenticationFailure(
    contextID: string = DefaultID,
    message?: string
  ): ServerError {
    return new ServerError(
      401,
      contextID,
      new KeyVaultError(
        "Unauthorized",
        message
      ),
      DefaultWWWAuthenticateHeader
    );
  }

  public static getTokenValidationFailure(
    contextID: string = DefaultID,
    code: string = "IDX10501"
  ): ServerError {
    return new ServerError(
      401,
      contextID,
      new KeyVaultError(
        "Unauthorized",
        `Error validating token: ${code}`
      ),
      DefaultWWWAuthenticateHeader
    );
  }
}
