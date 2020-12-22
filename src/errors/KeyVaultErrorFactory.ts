import KeyVaultError from "./KeyVaultError";

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
  ): KeyVaultError {
    const nameId = secretVersion ? `${secretName}/${secretVersion}` : secretName;
    return new KeyVaultError(
      404,
      "SecretNotFound",
      `A secret with (name/id) ${nameId} was not found in this key vault. If you recently deleted this secret you may be able to recover it using the correct recovery command. For help resolving this issue, please see https://go.microsoft.com/fwlink/?linkid=2125182`,
      contextID
    );
  }

  public static getBadParameter(
    contextID: string = DefaultID,
    message: string
  ): KeyVaultError {
    return new KeyVaultError(
      400,
      "BadParameter",
      message,
      contextID
    );
  }
}
