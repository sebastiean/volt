import Context from "../generated/Context";

export default class SecretsContext extends Context {
  public get xMsRequestID(): string | undefined {
    return this.contextId;
  }

  public set xMsRequestID(xMsRequestID: string | undefined) {
    this.contextId = xMsRequestID;
  }
}
