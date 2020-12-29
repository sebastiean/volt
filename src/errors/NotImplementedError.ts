import KeyVaultError from "./KeyVaultError";
import ServerError from "./ServerError";

/**
 * Create customized error types by inheriting ServerError
 *
 * @export
 * @class UnimplementedError
 * @extends {KeyVaultError}
 */
export default class NotImplementedError extends ServerError {
  public constructor(requestID: string = "") {
    super(
      500,
      requestID,
      new KeyVaultError(
        "APINotImplemented",
        "Current API is not implemented yet."
      ),
    );
  }
}