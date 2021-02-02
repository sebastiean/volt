import MiddlewareError from "../generated/errors/MiddlewareError";

/**
 * Represents an Azure Key Vault Error exception.
 *
 * @export
 * @class KeyVaultError
 * @extends {MiddlewareError}
 */
export default class KeyVaultError {
  public readonly keyVaultErrorCode: string;
  public readonly keyVaultErrorMessage?: string;
  public readonly innerError?: KeyVaultError;

  /**
   * Creates an instance of KeyVaultError.
   *
   * @param {string} keyVaultErrorCode Azure Key Vault error code, will be in response body
   * @param {string} [keyVaultErrorMessage] Azure Key Vault error message
   * @param {KeyVaultError} [innerError] The Key Vault Server error.
   * @memberof KeyVaultError
   */
  constructor(keyVaultErrorCode: string, keyVaultErrorMessage?: string, innerError?: KeyVaultError) {
    this.keyVaultErrorCode = keyVaultErrorCode;
    this.keyVaultErrorMessage = keyVaultErrorMessage;
    this.innerError = innerError;
  }

  public getBody(): any {
    let body: any = {
      code: this.keyVaultErrorCode,
      message: this.keyVaultErrorMessage,
    };

    if (this.innerError) {
      body = { ...body, innererror: this.innerError.getBody() };
    }

    return body;
  }
}
