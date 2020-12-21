import KeyVaultError from "./KeyVaultError";

/**
 * Create customized error types by inheriting ServerError
 *
 * @export
 * @class UnimplementedError
 * @extends {KeyVaultError}
 */
export default class NotImplementedError extends KeyVaultError {
  public constructor(requestID: string = "") {
    super(
      500,
      "APINotImplemented",
      "Current API is not implemented yet.",
      requestID
    );
  }
}