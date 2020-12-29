import KeyVaultError from "./KeyVaultError";
import ServerError from "./ServerError";

const DefaultID: string = "DefaultKeyVaultRequestID";

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
}
